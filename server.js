// =====================================================================
// server.js — FINAL GA REALTIME BACKEND (OpenAI client secret)
// =====================================================================

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ------------------------------------------------------------
// GENERATE CLIENT SECRET FOR BROWSER
// ------------------------------------------------------------
app.get("/api/secret", async (req, res) => {
    console.log("🔥 Creating GA realtime client secret…");

    try {
        // GA REALTIME SECRET CREATION — FINAL FORMAT
        const secret = await openai.realtime.clientSecrets.create({
            type: "realtime",                         // GA REQUIRED
            model: "gpt-4o-realtime-preview-2024-12-17",
            expires_in: 600                           // optional
        });

        console.log("✅ SECRET CREATED:", secret);
        res.json(secret);

    } catch (err) {
        console.error("❌ Failed to create client secret");
        console.log("OPENAI RESPONSE:", err.response?.data || err);

        res.status(500).json({
            error: "Failed to create realtime client secret",
            details: err.response?.data || err
        });
    }
});

// ------------------------------------------------------------
app.get("/", (req, res) => res.send("Lama Realtime Server Running"));
app.listen(3000, () => console.log("🔥 Server running on port 3000"));
