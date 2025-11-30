// server.js
// Clean, stable, OpenAI Realtime v1 WebSocket proxy
// Works on Render, Vercel, Railway, Fly.io, etc.

import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is missing in environment variables.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Lama Realtime Proxy is running.");
});

// ------------------------------------------------------------
// WS SERVER FOR BROWSER
// ------------------------------------------------------------
const wss = new WebSocketServer({ server });

wss.on("connection", (client) => {
  console.log("Client connected to proxy");

  let openaiReady = false;
  let messageQueue = [];

  // ------------------------------------------------------------
  // CONNECT TO OPENAI REALTIME WS
  // ------------------------------------------------------------
  const openai = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      },
      protocol: "openai-realtime-v1"   // REQUIRED
    }
  );

  openai.on("open", () => {
    console.log("Connected to OpenAI Realtime WS");
    openaiReady = true;

    // flush queued messages
    for (const msg of messageQueue) {
      try { openai.send(msg); } catch {}
    }
    messageQueue = [];
  });

  openai.on("error", (err) => {
    console.error("OpenAI WS ERROR:", err);
    try { client.close(1011, "OpenAI WS failed"); } catch {}
  });

  openai.on("close", (code, reason) => {
    console.warn("OpenAI WS closed:", code, reason);
    try { client.close(1000); } catch {}
  });

  // ------------------------------------------------------------
  // BROWSER → OPENAI
  // ------------------------------------------------------------
  client.on("message", (msg) => {
    if (!openaiReady) {
      messageQueue.push(msg);
      return;
    }

    try {
      openai.send(msg);
    } catch (err) {
      console.error("Error forwarding to OpenAI:", err);
    }
  });

  client.on("close", () => {
    console.log("Browser disconnected");
    try { openai.close(); } catch {}
  });

  // ------------------------------------------------------------
  // OPENAI → BROWSER
  // ------------------------------------------------------------
  openai.on("message", (msg) => {
    try {
      client.send(msg);
    } catch (err) {
      console.error("Error sending to browser:", err);
    }
  });
});

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Lama WS Proxy running on port", PORT);
});
