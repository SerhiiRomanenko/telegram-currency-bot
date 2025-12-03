

require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// ==== Функція для форматування повідомлення ====
function buildMessage(baseText) {
  return `${baseText}\n\n✅ <a href="https://t.me/huyova_bila_tserkva">Хуйова Біла Церква</a> | <a href="https://t.me/xy_bts">Прислати новину</a>`;
}

// ==== Відправка курсу ====
async function sendDailyRates() {
  try {
    // Курси ПриватБанку
    const res = await fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5");
    const data = await res.json();

    const formatNumber = (num) => parseFloat(num).toFixed(2);

    const usd = data.find(d => d.ccy === "USD");
    const eur = data.find(d => d.ccy === "EUR");

    const usdText = usd ? `🇺🇸Доллар: ${formatNumber(usd.buy)} / ${formatNumber(usd.sale)}` : "";
    const eurText = eur ? `🇪🇺Евро: ${formatNumber(eur.buy)} / ${formatNumber(eur.sale)}` : "";

    // Курси крипти через CoinGecko
    const cryptoRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const cryptoData = await cryptoRes.json();
    const btc = cryptoData.bitcoin.usd;
    const eth = cryptoData.ethereum.usd;

    // Формуємо повідомлення
    const text = `💱 <b>КУРС валют</b>\n(купівля / продаж)\n\n${usdText}\n${eurText}\n🪙 Bitcoin: ${btc}$\n🔷 ETH: ${eth}$`;

    await bot.sendMessage(CHAT_ID, buildMessage(text), { parse_mode: "HTML", disable_web_page_preview: true });
    console.log("Курс відправлено ✅");
  } catch (err) {
    console.error("Помилка при отриманні курсу:", err.message);
  }
}

// ==== Планування раз на день о 08:00 ====
cron.schedule("00 08 * * *", () => {
  console.log("Надсилаємо курс валют о 08:00…");
  sendDailyRates();
}, { timezone: "Europe/Kiev" });

// ==== EXPRESS сервер ====
const app = express();
app.get("/", (req, res) => {
  res.send("Бот працює 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
