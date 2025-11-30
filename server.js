// server.js - FINAL FIXED VERSION
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is missing!");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ------------------------------------------------------------------
// FIXED: Return ONLY session JSON, not nested object wrappers.
// ------------------------------------------------------------------
app.get("/api/ephemeral", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify({
        model: MODEL
      })
    });

    const session = await response.json();

    // REAL FIX:
    // Make sure client_secret.value is returned AS A STRING.
    if (typeof session?.client_secret?.value !== "string") {
      console.error("FATAL: client_secret.value is invalid", session);
      return res.status(500).json({
        error: "Invalid ephemeral session",
        details: session
      });
    }

    res.json(session);

  } catch (err) {
    console.error("Ephemeral session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("Lama WS backend running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Lama backend running on ${PORT}`);
});
