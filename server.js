// server.js
// Render backend: ONLY provides the ephemeral session endpoint.
// No static hosting. Frontend lives elsewhere.

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is missing.");
  process.exit(1);
}

const app = express();
app.use(cors());           // allow external frontend
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * Ephemeral session endpoint
 */
app.get("/api/ephemeral", async (req, res) => {
  try {
    const body = {
      model: MODEL
    };

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("Realtime session creation failed:", text);
      return res.status(500).json({ error: "Realtime session creation failed", details: text });
    }

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Ephemeral error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DO NOT SERVE index.html — frontend is external
app.get("/", (req, res) => {
  res.send("Lama backend is running. Frontend must be hosted separately.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lama backend running on port ${PORT}`);
});
