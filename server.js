import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable!");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Lama WebSocket Proxy is running");
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (client) => {
  console.log("Client connected");

  // Connect to OpenAI Realtime WebSocket
  const openai = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // Forward browser → OpenAI
  client.on("message", (msg) => {
    try {
      openai.send(msg);
    } catch (err) {
      console.error("Error sending to OpenAI:", err);
    }
  });

  // Forward OpenAI → browser
  openai.on("message", (msg) => {
    try {
      client.send(msg);
    } catch (err) {
      console.error("Error sending back to client:", err);
    }
  });

  // Clean shutdown
  client.on("close", () => openai.close());
  openai.on("close", () => client.close());
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Lama WS Proxy running on port", PORT);
});
