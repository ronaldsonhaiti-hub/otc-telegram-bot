import express from "express";
import { Telegraf } from "telegraf";

const app = express();
app.use(express.json());

// 🔐 VARIABLES D’ENVIRONNEMENT (Render)
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ BOT_TOKEN ou CHAT_ID manquant");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 🔔 Webhook pour recevoir les signaux
app.post("/signal", async (req, res) => {
  try {
    const {
      actif,
      direction,
      expiration,
      setup,
      heure
    } = req.body;

    const message = `
🔥 SIGNAL OTC M1

💱 Actif : ${actif}
📈 Direction : ${direction}
⏱ Expiration : ${expiration}
🎯 Setup : ${setup}

🕒 Heure : ${heure}
    `;

    await bot.telegram.sendMessage(CHAT_ID, message);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur envoi Telegram" });
  }
});

// 🌍 Health check (Render)
app.get("/", (req, res) => {
  res.send("✅ OTC Telegram Bot is running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
