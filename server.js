// server.js
import express from 'express';
import fetch from 'node-fetch';   // or global fetch in Node 18+
import cors from 'cors';
const app = express();

// Allow only the eddiy.edlytica.com origin
app.use(cors({ origin: 'https://eddiy.edlytica.com' }));

app.get('/api/secret', async (req, res) => {
  try {
    // Request an ephemeral key from OpenAI Realtime API
    const apiKey = process.env.OPENAI_API_KEY;  // Set your OpenAI API key in env
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,               // Bearer API key
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',                     // Required beta header
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',                 // Realtime-capable model
        voice: 'verse'                                    // (Optional) set voice if needed
      }),
    });
    if (!response.ok) {
      // Pass through error details from OpenAI
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    return res.json(data);  // e.g. { client_secret: { value: "...", expires_at: ... }, ... }
  } catch (err) {
    console.error("Error fetching ephemeral secret:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
