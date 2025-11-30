// server.js
// Render backend: ONLY provides the ephemeral client secret.
// FRONTEND is hosted elsewhere.

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
// CREATE REALTIME GA CLIENT SECRET
// ------------------------------------------------------------
app.get("/api/ephemeral", async (req, res) => {
  try {
    console.log("🔥 Creating GA realtime client secret…");

    const body = {
      models: [MODEL]       // 👈 ONLY allowed parameter
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
    console.log("🔥 OPENAI RESPONSE:", data);

    if (!r.ok) {
      console.error("❌ Failed to create client secret");
      return res.status(500).json({
        error: "Failed to create realtime client secret",
        details: data
      });
    }

    res.json(data);

  } catch (err) {
    console.error("❌ Ephemeral error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Lama backend running. Frontend hosted elsewhere.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Lama backend running on port ${PORT}`);
});
