import { createClient } from "@supabase/supabase-js";

const slots = new Set(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]);

const send = (res, status, data) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res.status(status).json(data);
};

export default async function handler(req, res) {
  // CORS preflight support
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  // Health / info check on GET
  if (req.method === "GET") {
    return send(res, 200, {
      status: "online",
      service: "parkflow-sensor-ingest",
      message: "Send POST requests with sensor telemetry and Bearer token authorization.",
      allowed_slots: Array.from(slots)
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET, OPTIONS");
    return send(res, 405, { error: "POST required" });
  }

  const token = process.env.DEVICE_INGEST_TOKEN;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token || !url || !key) {
    const missing = [];
    if (!token) missing.push("DEVICE_INGEST_TOKEN");
    if (!url) missing.push("SUPABASE_URL");
    if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    return send(res, 500, {
      error: "Server environment variables missing",
      missing
    });
  }

  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${token}`) {
    return send(res, 401, { error: "Unauthorized: Invalid or missing Bearer token" });
  }

  let b = req.body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      return send(res, 400, { error: "Invalid JSON body" });
    }
  }

  if (!b || typeof b !== "object" || Array.isArray(b)) {
    return send(res, 400, { error: "JSON object required" });
  }

  const device_id = String(b.device_id || "").trim();
  const slot_id = String(b.slot_id || "").toUpperCase();
  const distance_cm = Number(b.distance_cm);
  const occupied = b.occupied;
  const sensor_ok = b.sensor_ok !== false;

  let dt = new Date();
  if (b.recorded_at) {
    const parsed = new Date(b.recorded_at);
    if (Number.isFinite(parsed.getTime())) {
      if (Math.abs(Date.now() - parsed.getTime()) <= 86400000) {
        dt = parsed;
      }
    }
  }

  if (
    !device_id ||
    device_id.length > 80 ||
    !slots.has(slot_id) ||
    !Number.isFinite(distance_cm) ||
    distance_cm < 0 ||
    distance_cm > 1000 ||
    typeof occupied !== "boolean"
  ) {
    return send(res, 400, {
      error: "Invalid payload parameters",
      details: {
        device_id: device_id ? "valid" : "required (max 80 chars)",
        slot_id: slots.has(slot_id) ? "valid" : "must be S1..S8",
        distance_cm:
          Number.isFinite(distance_cm) && distance_cm >= 0 && distance_cm <= 1000
            ? "valid"
            : "must be number between 0 and 1000",
        occupied: typeof occupied === "boolean" ? "valid" : "must be boolean"
      }
    });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const recorded_at = dt.toISOString();

  const { error: e1 } = await supabase.from("sensor_readings").insert({
    device_id,
    slot_id,
    distance_cm,
    occupied,
    sensor_ok,
    recorded_at
  });
  if (e1) {
    return send(res, 500, { error: "Sensor reading save failed", detail: e1.message });
  }

  const { data: old } = await supabase
    .from("parking_slots")
    .select("occupied")
    .eq("slot_id", slot_id)
    .maybeSingle();

  const { error: e2 } = await supabase.from("parking_slots").upsert(
    {
      slot_id,
      device_id,
      distance_cm,
      occupied,
      sensor_ok,
      updated_at: recorded_at
    },
    { onConflict: "slot_id" }
  );
  if (e2) {
    return send(res, 500, { error: "Current slot update failed", detail: e2.message });
  }

  if (!old || old.occupied !== occupied) {
    const { error } = await supabase.from("parking_events").insert({
      device_id,
      slot_id,
      event_type: occupied ? "vehicle_detected" : "slot_freed",
      details: `Distance ${distance_cm.toFixed(1)} cm`,
      recorded_at
    });
    if (error) console.error("Parking event record error:", error.message);
  }

  if (slot_id === "S8") {
    const { data: all } = await supabase
      .from("parking_slots")
      .select("occupied,sensor_ok,updated_at");
    if (
      all?.length === 8 &&
      all.every(
        (s) =>
          s.sensor_ok &&
          s.occupied !== null &&
          Date.now() - new Date(s.updated_at).getTime() < 120000
      )
    ) {
      const n = all.filter((s) => s.occupied).length;
      const { error } = await supabase.from("occupancy_snapshots").insert({
        occupied_count: n,
        available_count: 8 - n,
        utilization_percent: (n / 8) * 100,
        recorded_at
      });
      if (error) console.error("Snapshot record error:", error.message);
    }
  }

  return send(res, 200, { ok: true, slot_id, recorded_at });
}
