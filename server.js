// server.js — Realtime GA (2024–11 official spec)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const MODEL = "gpt-4o-realtime-preview-2024-12-17";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
    console.error("ERROR: OPENAI_API_KEY missing");
    process.exit(1);
}

// ---- HEALTH CHECK ----
app.get("/", (req, res) => {
    res.json({ ok: true, msg: "Lama Realtime backend running" });
});

// ---- CREATE CLIENT SECRET (GA) ----
app.get("/api/secret", async (req, res) => {
    try {
        console.log("🔥 Creating GA realtime client secret…");

        const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "Content-Type": "application/json",
                "OpenAI-Beta": "realtime=v1"
            },
            body: JSON.stringify({
                model: MODEL
            })
        });

        const json = await r.json();
        console.log("🔥 OPENAI RESPONSE:", json);

        if (!r.ok) {
            console.error("❌ Failed to create client secret");
            return res.status(500).json(json);
        }

        res.json(json);

    } catch (e) {
        console.error("❌ Server error:", e);
        res.status(500).json({ error: "server_error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Lama backend running on ${PORT}`);
});
