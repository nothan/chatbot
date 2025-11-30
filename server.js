// server.js
// Backend on Render: exposes /api/secret that returns a GA realtime client secret

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-realtime"; // GA realtime model

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is missing.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------------------------------------------
// /api/secret -> calls /v1/realtime/client_secrets (GA)
// ------------------------------------------------------------------
app.get("/api/secret", async (_req, res) => {
  try {
    console.log("🔥 Creating GA realtime client secret…");

    const sessionConfig = {
      session: {
        type: "realtime",
        model: MODEL,
        instructions: "You are Lama, a Saudi friendly AI assistant.",
        modalities: ["text", "audio"],
        audio: {
          input: {
            format: "pcm16"
          },
          output: {
            format: "pcm16",
            voice: "coral"
          }
        }
      }
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionConfig)
    });

    const data = await r.json();
    console.log("OPENAI RESPONSE:", data);

    if (!r.ok) {
      console.error("❌ Failed to create client secret");
      return res
        .status(500)
        .json({ error: "Failed to create realtime client secret", details: data });
    }

    // GA returns { value: "ek_…", expires_at: ... }
    return res.json({
      client_secret: data.value,
      expires_at: data.expires_at
    });
  } catch (err) {
    console.error("❌ /api/secret error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Simple root
app.get("/", (_req, res) => {
  res.send("Lama backend (GA) is running. Frontend is hosted separately.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lama backend running on port ${PORT}`);
});
