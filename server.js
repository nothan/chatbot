// server.js — FINAL WORKING VERSION
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// --------------------------------------
// INIT OPENAI CLIENT
// --------------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------------------------
// CREATE REALTIME CLIENT SECRET (GA API)
// --------------------------------------
app.get("/api/secret", async (req, res) => {
  console.log("🔥 Creating GA realtime client secret…");

  try {
    const secret = await client.realtime.clientSecrets.create({
      model: "gpt-4o-realtime-preview-2024-12-17",
      expires_in: 600, // 10 minutes
    });

    console.log("✅ Secret created:", secret);
    res.json(secret);
  } catch (err) {
    console.log("❌ Failed to create realtime client secret");
    console.log("OPENAI RESPONSE:", err?.response?.data || err);

    res.status(500).json({
      error: "Failed to create realtime client secret",
      details: err?.response?.data || err,
    });
  }
});

// --------------------------------------
app.listen(10000, () => {
  console.log("Backend running on port 10000");
});
