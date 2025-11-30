// server.js — FINAL GA VERSION

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// GA client secret endpoint
app.get("/api/secret", async (req, res) => {
  try {
    console.log("🔥 Creating GA realtime client secret…");

    const body = {
      ttl: 300,
      session: {
        type: "realtime",           // REQUIRED
        model: MODEL,
        instructions: "You are Lama, a friendly Saudi AI assistant."
      }
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    console.log("OPENAI RESPONSE:", data);

    if (!r.ok) {
      console.log("❌ Failed to create client secret");
      return res.status(500).json({ error: data });
    }

    res.json(data);

  } catch (error) {
    console.error("SECRET ERROR:", error);
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/", (req, res) => {
  res.send("Lama backend running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
