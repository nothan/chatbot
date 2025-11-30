// server.js — FINAL FIXED RELAY (Realtime v1 compatible, text-only)

import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();

app.use(cors({ origin: "https://eddiy.edlytica.com" }));

app.get("/", (req, res) => res.send("Lama relay server running"));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`HTTP server listening on ${PORT}`)
);

const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (client) => {
  console.log("🟢 Browser connected to relay");

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      },
      perMessageDeflate: false,
      protocolVersion: 13
    }
  );

  openaiWs.on("open", () => {
    console.log("🔵 Relay connected to OpenAI");

    // 🔥 FINAL FIX: ONLY instructions allowed
    openaiWs.send(
      JSON.stringify({
        type: "session.update",
        session: {
          instructions: "You are Lama, a friendly assistant."
        }
      })
    );
  });

  // Browser → OpenAI
  client.on("message", (data) => {
    if (openaiWs.readyState !== WebSocket.OPEN) return;

    if (data instanceof Buffer) {
      openaiWs.send(data.toString("utf8"));
    } else {
      openaiWs.send(data);
    }
  });

  // OpenAI → Browser
  openaiWs.on("message", (data, isBinary) => {
    if (client.readyState !== WebSocket.OPEN) return;

    if (isBinary) {
      client.send(data); // audio (if ever enabled)
    } else {
      client.send(data.toString("utf8"));
      console.log("FORWARDED TEXT:", data.toString("utf8"));
    }
  });

  // Cleanup
  const closePair = (reason) => {
    console.log("🔻 Closing pair:", reason);
    try { client.close(); } catch (_) {}
    try { openaiWs.close(); } catch (_) {}
  };

  client.on("close", () => closePair("browser closed"));
  client.on("error", () => closePair("browser error"));
  openaiWs.on("close", () => closePair("openai closed"));
  openaiWs.on("error", (e) => {
    console.error("OpenAI WS error:", e);
    closePair("openai error");
  });
});
