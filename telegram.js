const fs = require('fs');
const colors = require('colors');
const TelegramBot = require('node-telegram-bot-api')
const $ = require('cheerio');

const botConfig = JSON.parse(fs.readFileSync("bot-config.json"));

let telegramBot = new TelegramBot(botConfig.telegramToken, { polling: true});

telegramBot.onText(/\//, (msg, match) => {
    
    const chatId = msg.chat.id
    
    
    const text = msg.text;


    console.log(msg.text);
  })