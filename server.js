// server.js — FINAL FIXED RELAY (text + audio correctly forwarded)

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

  // IMPORTANT: Enable proper text/binary handling
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      },
      perMessageDeflate: false,
      maxPayload: 512 * 1024 * 1024,
      protocolVersion: 13
    }
  );

  openaiWs.on("open", () => {
    console.log("🔵 Relay connected to OpenAI");

    openaiWs.send(
      JSON.stringify({
        type: "session.update",
        session: {
          instructions:
            "You are Lama, a friendly assistant.",
          modalities: ["text"],
          audio: { enabled: false }
        }
      })
    );
  });

  // SEND BROWSER → OPENAI
  client.on("message", (data) => {
    if (openaiWs.readyState !== WebSocket.OPEN) return;

    if (data instanceof Buffer) {
      const text = data.toString("utf8");
      openaiWs.send(text);
    } else {
      openaiWs.send(data);
    }
  });

  // SEND OPENAI → BROWSER   (THIS IS THE IMPORTANT FIX)
  openaiWs.on("message", (data, isBinary) => {
    if (client.readyState !== WebSocket.OPEN) return;

    if (isBinary) {
      // Audio
      client.send(data);
    } else {
      // JSON text
      const text = data.toString();
      client.send(text);
      console.log("FORWARDED TEXT:", text);
    }
  });

  // CLEANUP
  const closePair = (reason) => {
    console.log("🔻 Closing pair:", reason);
    try {
      if (client.readyState === WebSocket.OPEN) client.close();
    } catch (_) {}
    try {
      if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
    } catch (_) {}
  };

  client.on("close", () => closePair("browser closed"));
  client.on("error", () => closePair("browser error"));

  openaiWs.on("close", () => closePair("openai closed"));
  openaiWs.on("error", (e) => {
    console.error("OpenAI WS error:", e);
    closePair("openai error");
  });
});
