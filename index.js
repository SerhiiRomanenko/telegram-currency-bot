require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

function buildMessage(baseText) {
  return `${baseText}\n\n✅ <a href="https://t.me/huyova_bila_tserkva">Хуйова Біла Церква</a> | <a href="https://t.me/xy_dmin">Прислати новину</a>`;
}

async function sendDailyRates() {
  try {
    // ==== ПриватБанк
    const res = await fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5");
    const data = await res.json();

    const formatNumber = (num) => parseFloat(num).toFixed(2);

    const usd = data.find(d => d.ccy === "USD");
    const eur = data.find(d => d.ccy === "EUR");

    const usdText = usd ? `🇺🇸Долар: ${formatNumber(usd.buy)} / ${formatNumber(usd.sale)}` : "";
    const eurText = eur ? `🇪🇺Євро: ${formatNumber(eur.buy)} / ${formatNumber(eur.sale)}` : "";

    // ==== Binance (Bitcoin + Ethereum)
const [btcRes, ethRes] = await Promise.all([
  fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"),
  fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT")
]);

const btcData = await btcRes.json();
const ethData = await ethRes.json();

const btcPrice = btcData.price
  ? Math.round(Number(btcData.price))
  : "N/A";

const ethPrice = ethData.price
  ? Math.round(Number(ethData.price))
  : "N/A";

    // ==== Повідомлення
    const text =
      `💱 <b>КУРС ВАЛЮТ</b>\n(купівля / продаж)\n\n` +
      `${usdText}\n` +
      `${eurText}\n` +
      `🪙 Bitcoin: ${btcPrice}$\n` +
      `🔷 ETH: ${ethPrice}$`;

    await bot.sendMessage(
      CHAT_ID,
      buildMessage(text),
      { parse_mode: "HTML", disable_web_page_preview: true }
    );

    console.log("Курс відправлено ✅");
  } catch (err) {
    console.error("Помилка при отриманні курсу:", err);
  }
}

// ==== Щоденна відправка о 08:00 (Київ)
let lastSentDate = null;

setInterval(() => {
  const now = new Date();
  const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }));
  const hours = kyivTime.getHours();
  const minutes = kyivTime.getMinutes();
  const today = kyivTime.toISOString().split("T")[0];

  if ((hours === 8 && minutes === 0 && lastSentDate !== today) ||
      (hours > 8 && lastSentDate !== today)) {

    console.log("⏰ Відправляємо курс валют");
    lastSentDate = today;
    sendDailyRates();
  }
}, 60 * 1000);

// ==== Express (для Render)
const app = express();
app.get("/", (req, res) => {
  res.send("Бот працює 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));