
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Telegram
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Test message
bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 Bot OTC actif !");
});

// Endpoint Render (obligatoire)
app.get("/", (req, res) => {
  res.send("OTC Telegram Bot is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
