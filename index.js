const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============ ENV CHECK ============
const token = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!token) {
  console.error("❌ BOT_TOKEN manquant (Render > Environment)");
  process.exit(1);
}
if (!CHAT_ID) {
  console.error("❌ CHAT_ID manquant (Render > Environment)");
  process.exit(1);
}

// ============ TELEGRAM BOT ============
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (err) => console.log("❌ polling_error:", err?.message || err));
bot.on("error", (err) => console.log("❌ bot_error:", err?.message || err));

// Répond en privé si tu écris au bot
bot.on("message", (msg) => {
  // évite de répondre aux messages du channel si jamais
  if (msg.chat && msg.chat.type === "private") {
    bot.sendMessage(msg.chat.id, "✅ Bot en ligne. (private message reçu)");
  }
});

// ============ SESSIONS (UTC) ============
/**
 * Heures en UTC (simple et robuste)
 * Asia   : 00:00 - 09:00 UTC
 * London : 07:00 - 16:00 UTC
 * US     : 13:00 - 22:00 UTC
 */
function isInTradingSessionUTC(date = new Date()) {
  const h = date.getUTCHours();

  const inAsia = h >= 0 && h < 9;
  const inLondon = h >= 7 && h < 16;
  const inUS = h >= 13 && h < 22;

  return inAsia || inLondon || inUS;
}

// ============ SIGNAL ENGINE (DEMO) ============
const PAIRS = ["GBPUSD OTC", "AUDUSD OTC", "CADUSD OTC"];
let pairIndex = 0;

// anti-spam: garde la dernière minute d’envoi
let lastSentAt = 0;

// toutes les 3 minutes
const INTERVAL_MS = 3 * 60 * 1000;

function buildSignalMessage(pair) {
  // ⚠️ Ceci est un signal "DEMO" (exemple). À remplacer par ta vraie logique.
  const direction = Math.random() > 0.5 ? "CALL" : "PUT";

  return `🔥 SIGNAL OTC M1

💱 Actif : ${pair}
📈 Direction : ${direction}
⏱ Expiration : 1 minute
🎯 Setup : Pullback EMA 50

🕒 Heure (UTC) : ${new Date().toUTCString()}
`;
}

async function sendSignalIfAllowed() {
  const now = Date.now();

  // 1) Session check
  if (!isInTradingSessionUTC()) {
    console.log("⏸ Hors session (UTC) - aucun signal.");
    return;
  }

  // 2) Anti-spam (au cas où Render redémarre / bug)
  if (now - lastSentAt < INTERVAL_MS - 5000) {
    console.log("⏳ Anti-spam actif - skip.");
    return;
  }

  // 3) Choisir la paire (rotation)
  const pair = PAIRS[pairIndex % PAIRS.length];
  pairIndex++;

  const message = buildSignalMessage(pair);

  try {
    await bot.sendMessage(CHAT_ID, message);
    lastSentAt = now;
    console.log("✅ Signal envoyé:", pair, new Date().toISOString());
  } catch (e) {
    console.log("❌ Erreur sendMessage:", e?.message || e);
  }
}

// ============ STARTUP ============
(async () => {
  try {
    await bot.sendMessage(CHAT_ID, "✅ Bot redémarré sur Render (OK)");
  } catch (e) {
    console.log("❌ Impossible d'envoyer le message de démarrage:", e?.message || e);
  }

  // Premier tick après 10s
  setTimeout(sendSignalIfAllowed, 10000);

  // Puis toutes les 3 minutes
  setInterval(sendSignalIfAllowed, INTERVAL_MS);
})();

// ============ RENDER HEALTH ENDPOINT ============
app.get("/", (req, res) => {
  res.send("OTC Telegram Bot is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
