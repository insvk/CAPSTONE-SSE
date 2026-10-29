export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    status: "healthy",
    service: "parkflow-api",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
}

