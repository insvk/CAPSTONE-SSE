# ParkFlow Setup & Deployment Guide

## 1. System Data Flow
```
ESP32 / Wokwi (Sensors)
       │
       ▼ HTTPS POST /api/ingest [Bearer Token]
Vercel Serverless Function
       │
       ▼ PostgreSQL Upsert & Event Log
Supabase Database
       │
       ▼ WebSocket Publication (supabase_realtime)
ParkFlow Live Web Dashboard
```

---

## 2. Supabase Setup

1. Log in to [Supabase](https://supabase.com).
2. Open your project's **SQL Editor** and execute the schema located in `supabase/schema.sql`.
3. In **Database > Publications**, verify that `supabase_realtime` has the following tables enabled:
   - `parking_slots`
   - `sensor_readings`
   - `parking_events`
   - `gate_events`
   - `occupancy_snapshots`
4. Copy the following keys from **Project Settings > API**:
   - **Project URL** (`SUPABASE_URL`)
   - **anon / public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 3. Server Environment Variables (.env)

Create a `.env` file locally (copied from `.env.example`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
SUPABASE_ANON_KEY=your_anon_public_key
DEVICE_INGEST_TOKEN=your_device_ingest_token
```

To generate a secure 32-byte hexadecimal `DEVICE_INGEST_TOKEN`:
- **PowerShell:** `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`
- **macOS / Linux:** `openssl rand -hex 32`

---

## 4. Local Testing

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```

Visit `http://localhost:3000` in your browser. The dashboard will automatically fetch public keys from `/api/config` or `public/config.js`.

---

## 5. Deploy to Vercel

1. Push your changes to GitHub repository: `https://github.com/insvk/CAPSTONE-SSE`.
2. Open the [Vercel Dashboard](https://vercel.com) and click **Add New... > Project**.
3. Import your repository (`CAPSTONE-SSE`).
4. In **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `DEVICE_INGEST_TOKEN`
5. Click **Deploy**.

Vercel will automatically build the project, deploy the static dashboard, and configure the `/api/ingest`, `/api/config`, and `/api/health` Serverless Functions.

---

## 6. Testing Ingestion API

You can verify the live deployment using PowerShell:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_DEVICE_INGEST_TOKEN"
    "Content-Type"  = "application/json"
}

$body = @{
    device_id   = "wokwi-esp32-01"
    slot_id     = "S1"
    distance_cm = 22.5
    occupied    = $true
    sensor_ok   = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://YOUR-VERCEL-DOMAIN.vercel.app/api/ingest" -Headers $headers -Body $body
```

Expected response:
```json
{
  "ok": true,
  "slot_id": "S1",
  "recorded_at": "2026-10-29T16:30:00.000Z"
}
```

Repeat for slots `S1` through `S8`. The dashboard will immediately update live via Supabase Realtime!

---

## 7. Connecting Hardware / Wokwi Simulator
Refer to [firmware/README.md](firmware/README.md) for sample C++ code snippets to embed in your ESP32 Arduino / ESP-IDF firmware.
