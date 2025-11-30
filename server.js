// server.js — Final Relay Version (Browser <-> Relay <-> OpenAI Realtime)
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

// MAIN WEBSOCKET RELAY
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (client) => {
  console.log("🟢 Browser connected to relay");

  // Connect relay → OpenAI Realtime WS
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  // Relay successfully connected to OpenAI
  openaiWs.on("open", () => {
    console.log("🔵 Relay connected to OpenAI");

    // Default startup instructions
    const sessionUpdate = {
      type: "session.update",
      session: {
        instructions:
          "You are Lama, a friendly sales assistant. Reply in Arabic if the user types Arabic, otherwise English. Keep replies short.",
      },
    };

    openaiWs.send(JSON.stringify(sessionUpdate));
  });

  // ---------- FIXED: HANDLE BROWSER → OPENAI PIPE (TEXT ONLY) ----------
  client.on("message", (data) => {
    if (openaiWs.readyState !== WebSocket.OPEN) return;

    // If browser sends binary instead of text, convert it
    if (data instanceof Buffer) {
      try {
        const text = data.toString("utf8");
        openaiWs.send(text);
      } catch (e) {
        console.error("❌ Could not decode binary frame:", e);
      }
      return;
    }

    // If it's already a string, forward directly
    if (typeof data === "string") {
      openaiWs.send(data);
      return;
    }

    console.error("❌ Unknown frame type from browser:", typeof data);
  });

  // ---------- OPENAI → BROWSER PIPE ----------
  openaiWs.on("message", (data) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  // ---------- CLOSE HANDLING ----------
  const closeAll = (why) => {
    console.log("🔻 Closing pair:", why);

    if (client.readyState === WebSocket.OPEN) client.close();
    if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
  };

  client.on("close", () => closeAll("browser closed"));
  client.on("error", (e) => {
    console.error("Browser WS error:", e);
    closeAll("browser error");
  });

  openaiWs.on("close", () => closeAll("openai closed"));
  openaiWs.on("error", (e) => {
    console.error("OpenAI WS error:", e);
    closeAll("openai error");
  });
});
