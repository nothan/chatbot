// server.js (Node.js / Express)
import express from 'express';
import fetch from 'node-fetch'; // if Node 18+, can use global fetch
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/token', async (req, res) => {
  try {
    const resp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify({
        session: {
          type: "realtime",          // Use "realtime" for chat; use "transcription" for STT:contentReference[oaicite:3]{index=3}
          model: process.env.MODEL || "gpt-realtime"
        }
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    // Return the entire JSON; client will use data.client_secret.value
    res.json(data);
  } catch (err) {
    console.error("Failed to create realtime client secret:", err);
    res.status(500).json({ error: "Failed to create realtime client secret" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
