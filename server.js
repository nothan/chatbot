// server.js
// Backend for Lama: creates ephemeral Realtime sessions for the browser.

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL =
  process.env.REALTIME_MODEL || "gpt-4o-realtime-preview-2024-12-17";

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (index.html, lama-agent.js, css) from /public
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/ephemeral
 *
 * The browser calls this endpoint to get an ephemeral Realtime session.
 * We call OpenAI:
 *   POST https://api.openai.com/v1/realtime/sessions
 *   headers:
 *     Authorization: Bearer <OPENAI_KEY>
 *     Content-Type: application/json
 *     OpenAI-Beta: realtime=v1
 */
app.get("/api/ephemeral", async (req, res) => {
  try {
    const body = {
      model: MODEL,
      // You can also fix voice/instructions here if you want:
      // voice: "coral",
      // instructions: "You are Lama, a Saudi sales & support AI assistant..."
    };

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error(
        "Error creating Realtime session:",
        r.status,
        r.statusText,
        text
      );
      return res
        .status(500)
        .json({ error: "Failed to create Realtime session", details: text });
    }

    const data = await r.json();
    // We return the whole session payload; the browser uses client_secret.value
    res.json(data);
  } catch (err) {
    console.error("Ephemeral endpoint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// For convenience, serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lama backend running on port ${PORT}`);
});
