// server.js - FULL DEBUG VERSION
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY missing.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------------------
// DEBUG function
// -----------------------------------------------------------
function log(tag, data) {
  console.log("======== " + tag + " ========");
  console.log(JSON.stringify(data, null, 2));
  console.log("=================================");
}

// -----------------------------------------------------------
// Ephemeral endpoint
// -----------------------------------------------------------
app.get("/api/ephemeral", async (req, res) => {
  try {
    console.log(">>> Incoming /api/ephemeral request");

    const body = { model: MODEL };

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify(body)
    });

    const rawText = await r.text();

    log("RAW RESPONSE FROM OPENAI", rawText);

    let session;
    try {
      session = JSON.parse(rawText);
    } catch (err) {
      log("JSON PARSE ERROR", err);
      return res.status(500).json({ error: "Invalid JSON from OpenAI", rawText });
    }

    log("PARSED SESSION JSON", session);

    if (!session?.client_secret?.value || typeof session.client_secret.value !== "string") {
      log("FATAL: INVALID client_secret.value", session);
      return res.status(500).json({ error: "Invalid secret", session });
    }

    log("RETURNING SECRET TO FRONTEND", {
      secret: session.client_secret.value.substring(0, 10) + "..."
    });

    res.json(session);

  } catch (err) {
    log("SERVER ERROR", err);
    res.status(500).json({ error: "Internal server error", details: err.toString() });
  }
});

// -----------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Lama backend running (debug mode).");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("======================================");
  console.log(`🔥 Lama backend running on ${PORT}`);
  console.log("======================================");
});
