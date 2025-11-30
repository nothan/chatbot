import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Init GA OpenAI SDK
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Your realtime model
const MODEL = "gpt-4o-realtime-preview-2024-12-17";

// ====================================================================
// Create REALTIME client secret (GA API)  ✅
// ====================================================================
app.get("/api/secret", async (req, res) => {
    try {
        console.log("🔥 Creating GA realtime client secret…");

        const secret = await openai.realtime.clientSessions.clientSecrets.create({
            session: {
                type: "realtime",
                model: MODEL
            }
        });

        console.log("✅ SECRET CREATED:", secret);
        res.json(secret);

    } catch (err) {
        console.error("❌ Failed to create client secret");
        console.error("OPENAI RESPONSE:", err);

        res.status(500).json({
            error: "Failed to create realtime client secret",
            details: err?.error || err
        });
    }
});

// ------------------------------------------------
app.get("/", (req, res) => {
    res.send("Lama Realtime Backend OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
