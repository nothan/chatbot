// server.js — WebSocket relay (final version with binary→text fix)
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

const app = express();

// Allow ONLY your frontend domain
app.use(cors({ origin: "https://eddiy.edlytica.com" }));

app.get("/", (req, res) => res.send("Lama relay server is running."));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`HTTP server listening on port ${PORT}`)
);

// MAIN WebSocket RELAY
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (client) => {
  console.log("🟢 Browser connected to relay");

  // Connect to OpenAI Realtime
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  openaiWs.on("open", () => {
    console.log("🔵 Relay connected to OpenAI");

    // Default instructions
    openaiWs.send(
      JSON.stringify({
        type: "session.update",
        session: {
          instructions:
            "You are Lama, a friendly sales assistant.",
          modalities: ["text"],
          audio: { enabled: false }
        }
      })
    );
  });

  // ----------- FIX: Convert binary -> UTF8 text for OpenAI -----------
  client.on("message", (data) => {
    if (openaiWs.readyState !== WebSocket.OPEN) return;

    if (data instanceof Buffer) {
      try {
        const text = data.toString("utf8");
        openaiWs.send(text);
      } catch (e) {
        console.error("❌ Could not decode binary frame:", e);
      }
    } else if (typeof data === "string") {
      openaiWs.send(data);
    } else {
      console.error("Unknown client→relay frame:", typeof data);
    }
  });

  // Relay OpenAI → browser
  openaiWs.on("message", (data) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  // close handlers
  const closePair = (why) => {
    console.log("🔻 Closing pair:", why);
    try {
      if (client.readyState === WebSocket.OPEN) client.close();
      if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
    } catch (_) {}
  };

  client.on("close", () => closePair("browser closed"));
  client.on("error", (e) => {
    console.error("Browser WS error:", e);
    closePair("browser error");
  });

  openaiWs.on("close", () => closePair("openai closed"));
  openaiWs.on("error", (e) => {
    console.error("OpenAI WS error:", e);
    closePair("openai error");
  });
});
