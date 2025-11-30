// server.js
// Render backend: ONLY provides the GA Realtime client_secret endpoint.
// Frontend (lama-agent.js + UI) is hosted somewhere else.

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17"; // same as in lama-agent.js

if (!OPENAI_KEY) {
  console.error("❌ OPENAI_API_KEY is missing in env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------
// GA client_secret for browser Realtime WS
// ---------------------------------------------------------------------
app.get("/api/secret", async (_req, res) => {
  try {
    console.log("==> Creating GA realtime client secret…");

    // ⚠️ IMPORTANT:
    // client_secrets only accepts a limited session object.
    // NO session.modalities, NO session.audio.*, etc.
    const body = {
      session: {
        type: "realtime",
        model: MODEL,
        // optional but allowed:
        instructions:
          "You are Lama, a friendly Saudi AI assistant. Reply in Saudi Arabic when the user uses Arabic, otherwise in English.",
      },
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    console.log("OPENAI RESPONSE:", data);

    if (!r.ok) {
      console.error("❌ Failed to create client secret");
      return res.status(500).json({
        error: "Failed to create realtime client secret",
        details: data,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ /api/secret error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Root info
app.get("/", (_req, res) => {
  res.send("Lama backend is running. Frontend is hosted separately.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lama backend running on port ${PORT}`);
});
