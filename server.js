// server.js
// Render backend: ONLY provides the ephemeral session endpoint.
// Frontend is hosted separately. This backend must be CORS-open.

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("❌ ERROR: OPENAI_API_KEY is missing.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());


// ------------------------------------------------------------
// HEALTH CHECK
// ------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// ------------------------------------------------------------
// GET EPHEMERAL CLIENT SECRET (Realtime GA)
// ------------------------------------------------------------
app.get("/api/ephemeral", async (req, res) => {
  try {
    console.log("🔥 Requesting GA client secret…");

    const body = {
      expires_in: 3600,                          // 1 hour
      models: [MODEL]                            // allow only our realtime model
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    console.log("🔥 GA CLIENT SECRET RESPONSE:", data);

    if (!r.ok) {
      console.error("❌ GA secret creation failed:", data);
      return res.status(500).json({
        error: "Failed to create realtime client secret",
        details: data
      });
    }

    // Return to frontend: { client_secret: { value, expires_at }, id, ... }
    res.json(data);

  } catch (err) {
    console.error("❌ Ephemeral error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ------------------------------------------------------------
// ROOT
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Lama backend is running. Frontend must be hosted separately.");
});


// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Lama backend running on port ${PORT}`);
});
