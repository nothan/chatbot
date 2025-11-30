// server.js
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();

// Allow only your frontend origin
app.use(cors({ origin: "https://eddiy.edlytica.com" }));

// Simple health check
app.get("/", (req, res) => {
  res.send("Lama relay server is running.");
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`HTTP server listening on port ${PORT}`)
);

// --- WebSocket relay ---
// Clients connect to: wss://lama-proxy.onrender.com/realtime
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (client) => {
  console.log("🟢 Browser connected to relay");

  // Open WebSocket to OpenAI Realtime API
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  openaiWs.on("open", () => {
    console.log("🔵 Relay connected to OpenAI");

    // Optional: immediately send a session.update with default instructions
    const sessionUpdate = {
      type: "session.update",
      session: {
        instructions:
          "You are Lama, a friendly sales assistant. Reply in Arabic if user types Arabic, otherwise English. Keep replies short.",
      },
    };
    openaiWs.send(JSON.stringify(sessionUpdate));
  });

  // Pipe messages browser → OpenAI
  client.on("message", (data) => {
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.send(data);
    }
  });

  // Pipe messages OpenAI → browser
  openaiWs.on("message", (data) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  // Handle closes / errors
  const closeBoth = (why) => {
    console.log("🔻 Closing pair:", why);
    if (client.readyState === WebSocket.OPEN) client.close();
    if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
  };

  client.on("close", () => closeBoth("browser closed"));
  client.on("error", (e) => {
    console.error("Client WS error:", e);
    closeBoth("browser error");
  });

  openaiWs.on("close", () => closeBoth("openai closed"));
  openaiWs.on("error", (e) => {
    console.error("OpenAI WS error:", e);
    closeBoth("openai error");
  });
});
