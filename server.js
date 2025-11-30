import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY missing");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Lama Realtime Proxy running on Render.");
});

// Create WS server for browser
const wss = new WebSocketServer({ server });

wss.on("connection", (client) => {
  console.log("Client connected to proxy");

  let openaiReady = false;
  let messageQueue = [];

  // Create WS to OpenAI
  const openai = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // When OpenAI is ready
  openai.on("open", () => {
    console.log("Connected to OpenAI realtime WS");
    openaiReady = true;

    // Flush queued messages
    messageQueue.forEach((msg) => openai.send(msg));
    messageQueue = [];
  });

  // When OpenAI errors
  openai.on("error", (err) => {
    console.error("OpenAI WS ERROR:", err);
    client.close(1011, "OpenAI WS error");
  });

  // When browser sends message → forward to OpenAI
  client.on("message", (msg) => {
    if (!openaiReady) {
      // Queue until OpenAI WS is open
      messageQueue.push(msg);
      return;
    }

    try {
      openai.send(msg);
    } catch (err) {
      console.error("Error sending to OpenAI:", err);
    }
  });

  // When OpenAI sends message → forward to browser
  openai.on("message", (msg) => {
    try {
      client.send(msg);
    } catch (err) {
      console.error("Error sending to browser:", err);
    }
  });

  // Cleanup for browser disconnecting
  client.on("close", () => {
    console.log("Browser disconnected");
    openai.close();
  });

  // Cleanup for OpenAI closing
  openai.on("close", () => {
    console.log("OpenAI WS closed");
    client.close();
  });
});


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Lama WS Proxy running on port", PORT);
});
