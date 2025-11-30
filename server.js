import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("ERROR: Missing OPENAI_API_KEY!");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Lama WebSocket Proxy is running.");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (client) => {
  console.log("Client connected to proxy");

  // CONNECT TO OPENAI REALTIME WS
  const openai = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  openai.on("open", () => {
    console.log("Connected to OpenAI realtime WS");
  });

  openai.on("error", (err) => {
    console.error("OpenAI WS ERROR:", err);
  });

  // CLIENT → OPENAI
  client.on("message", (msg) => {
    try {
      openai.send(msg);
    } catch (err) {
      console.error("Error sending to OpenAI:", err);
    }
  });

  // OPENAI → CLIENT
  openai.on("message", (msg) => {
    try {
      client.send(msg);
    } catch (err) {
      console.error("Error returning message to client:", err);
    }
  });

  // CLOSE BOTH SIDES
  client.on("close", () => {
    console.log("Client disconnected");
    openai.close();
  });

  openai.on("close", () => {
    console.log("OpenAI WS closed");
    client.close();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Lama WS Proxy running on port", PORT);
});
