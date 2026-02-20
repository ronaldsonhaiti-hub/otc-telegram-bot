// index.js (Render Background Worker) - Copy/Paste

const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// ================== ENV ==================
const token = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!token) {
  console.error("❌ BOT_TOKEN manquant (Render Environment Variables)");
  process.exit(1);
}
if (!CHAT_ID) {
  console.error("❌ CHAT_ID manquant (Render Environment Variables)");
  process.exit(1);
}

// ================== BOT INIT (Polling) ==================
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (err) => console.log("❌ polling_error:", err?.message || err));
bot.on("error", (err) => console.log("❌ bot_error:", err?.message || err));

// ================== OPTIONAL: Reply to test ==================
bot.on("message", (msg) => {
  // Répond juste "OK" si tu écris au bot en privé (ça confirme que le token marche)
  if (msg.chat && msg.chat.type === "private") {
    bot.sendMessage(msg.chat.id, "✅ OK (token/polling fonctionne)");
  }
});

// ================== SESSIONS (UTC) ==================
// Asia (Tokyo) ~ 00:00 - 09:00 UTC
// London ~ 07:00 - 16:00 UTC
// US (NY) ~ 13:00 - 22:00 UTC
function isInTradingSessionUTC(date = new Date()) {
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const hm = h + m / 60;

  const inAsia = hm >= 0 && hm < 9;
  const inLondon = hm >= 7 && hm < 16;
  const inUS = hm >= 13 && hm < 22;

  return inAsia || inLondon || inUS;
}

// ================== SIGNAL CONFIG ==================
const PAIRS = ["GBPUSD OTC", "AUDUSD OTC", "CADUSD OTC"];
let pairIndex = 0;

// Toutes les 3 minutes
const INTERVAL_MS = 3 * 60 * 1000;

// Anti-spam (au cas où Render redémarre)
let lastBootMsgAt = 0;
function sendBootMessage() {
  const now = Date.now();
  if (now - lastBootMsgAt < 10 * 60 * 1000) return; // 10 minutes
  lastBootMsgAt = now;

  bot.sendMessage(CHAT_ID, "✅ Bot démarré sur Render (Worker OK)").catch((e) => {
    console.log("❌ boot send error:", e?.message || e);
  });
}
sendBootMessage();

// ================== DEMO SIGNAL ENGINE ==================
function randomDirection() {
  return Math.random() > 0.5 ? "CALL" : "PUT";
}

function buildSignalMessage(pair) {
  const direction = randomDirection();
  const nowUTC = new Date().toUTCString();

  return `🔥 SIGNAL OTC M1

💱 Actif : ${pair}
📈 Direction : ${direction}
⏱ Expiration : 1 minute
🎯 Setup : Pullback EMA 50

🕒 Heure (UTC) : ${nowUTC}`;
}

// Anti-spam envoi (évite trop de messages)
let lastSentAt = 0;
function canSendNow() {
  const now = Date.now();
  // minimum 60 secondes entre messages
  if (now - lastSentAt < 60 * 1000) return false;
  lastSentAt = now;
  return true;
}

async function tick() {
  try {
    // 1) session filter
    if (!isInTradingSessionUTC(new Date())) return;

    // 2) anti-spam
    if (!canSendNow()) return;

    // 3) pick pair
    const pair = PAIRS[pairIndex % PAIRS.length];
    pairIndex++;

    // 4) send message
    const msg = buildSignalMessage(pair);
    await bot.sendMessage(CHAT_ID, msg);
    console.log("✅ Signal envoyé:", pair);
  } catch (e) {
    console.log("❌ tick error:", e?.message || e);
  }
}

// Lance immédiatement, puis toutes les 3 minutes
tick();
setInterval(tick, INTERVAL_MS);

console.log("✅ Worker running. Interval:", INTERVAL_MS, "ms");
