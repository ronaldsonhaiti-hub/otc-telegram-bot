const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN manquant");
  process.exit(1);
}

// ✅ IMPORTANT : polling = true (sinon le bot ne lit rien)
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (err) => console.log("❌ polling_error:", err.message));
bot.on("error", (err) => console.log("❌ bot_error:", err.message));

// ✅ Message de démarrage (optionnel mais super utile)
const CHAT_ID = process.env.CHAT_ID;
if (CHAT_ID) {
  bot.sendMessage(CHAT_ID, "✅ Bot redémarré sur Render (OK)").catch(() => {});
}

// ✅ Si tu écris au bot en privé ou dans un groupe
bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 Bot en ligne ! (message)");
});

// ✅ Si tu postes dans un CANAL (channel)
bot.on("channel_post", (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 Bot en ligne ! (channel_post)");
});

// Endpoint Render
app.get("/", (req, res) => res.send("OTC Telegram Bot is running ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// 🔥 SIGNAL TEST AUTO (une seule fois)
function sendSignal() {
  const CHAT_ID = process.env.CHAT_ID;

  if (!CHAT_ID) {
    console.log("❌ CHAT_ID manquant");
    return;
  }

  const message = `
🔥 SIGNAL OTC M1

💱 Actif : GBPUSD OTC
📈 Direction : PUT
⏱ Expiration : 1 minute
🎯 Setup : Pullback EMA 50

🕒 Heure : ${new Date().toUTCString()}
`;

  bot.sendMessage(CHAT_ID, message);
}

// ⏱ envoi 10 secondes après le démarrage
setTimeout(sendSignal, 10000);
