import express from "express";
import http from "http";
import WebSocket from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Health check
app.get("/", (req, res) => {
  res.send("Lama WebSocket Proxy is running");
});

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

  // Browser → OpenAI
  client.on("message", (msg) => {
    openai.send(msg);
  });

  // OpenAI → Browser
  openai.on("message", (msg) => {
    client.send(msg);
  });

  // Close both sockets together
  client.on("close", () => openai.close());
  openai.on("close", () => client.close());
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Proxy running on port", PORT));
