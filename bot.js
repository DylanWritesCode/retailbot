const puppeteer = require('puppeteer');
const fs = require('fs');
const colors = require('colors');
const TelegramBot = require('node-telegram-bot-api')
const $ = require('cheerio');

const botConfig = JSON.parse(fs.readFileSync("bot-config.json"));
let telegramBot = undefined;

let telegramDebugMode = false;

let currentIndex = 0;

function initTelegram(){
    if(telegramBot == undefined)
    {
        telegramBot = new TelegramBot(botConfig.telegramToken, { polling: true});
    }
}

let lastStockCheck = Date.now();
const browser = undefined;

async function initBrowser(){

    try{
        if(browser != undefined)
        browser.close();
    }catch(e){}

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

    await page.goto(botConfig.gameStopProducts[0].url);
    return page;
}

async function checkStock(page){
    try{
        await page.reload();
        let content = await page.evaluate(() => document.body.innerHTML);
        await page.waitForSelector("button[data-buttontext='Add to Cart']");
    
        let jsonData = undefined;
    
        $("button[data-buttontext='Add to Cart']", content).each(function(){
            if(jsonData == undefined)
             jsonData = JSON.parse($(this).attr('data-gtmdata'));
        })
    
        if(jsonData.productInfo.availability.trim() == "Available")
        {
            console.log(`[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is ` + colors.green('IN STOCK'));
            telegramBot.sendMessage(botConfig.telegramChatId, `[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is IN STOCK!`);
            telegramBot.sendMessage(botConfig.telegramChatId, botConfig.gameStopProducts[currentIndex].url);
        }
        else if(jsonData.productInfo.availability.trim() == "Not Available")
        {
            if(telegramDebugMode)
                telegramBot.sendMessage(botConfig.telegramChatId, `[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is NOT IN STOCK!`);

            console.log(`[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is ` + colors.yellow('NOT IN STOCK!'));
        }
        else
        {
            if(telegramDebugMode)
             telegramBot.sendMessage(botConfig.telegramChatId, `[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is UNKNOWN!`);

            console.log(`[${getCurrentTimestamp()}] ${botConfig.gameStopProducts[currentIndex].id} is ` + colors.grey('UNKNOWN!'));
        }
    
        currentIndex = currentIndex+1;
        if(botConfig.gameStopProducts.length < currentIndex+1)
        currentIndex = 0;
    
        await page.goto(botConfig.gameStopProducts[currentIndex].url);
        lastStockCheck = getCurrentTimestamp();
        setTimeout(checkStock, 1000, page);

    }catch(e)
    {
        console.log(`[${getCurrentTimestamp()}] Restarting Retail Bot...`);
        console.log(e);
        monitor();
    }
}

function getCurrentTimestamp(){
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = IntTwoChars(date_ob.getDate());
    let month = IntTwoChars(date_ob.getMonth() + 1);
    let year = date_ob.getFullYear();
    let hours = IntTwoChars(date_ob.getHours());
    let minutes = IntTwoChars(date_ob.getMinutes());
    let seconds = IntTwoChars(date_ob.getSeconds());
    return `${month}-${date}-${year} ${hours}:${minutes}:${seconds}`;    
}

function IntTwoChars(i) {
    return (`0${i}`).slice(-2);
}

async function monitor(){
    try{
        console.log(`[${getCurrentTimestamp()}] Starting Retail Bot...`);
        console.log(`[${getCurrentTimestamp()}] Initalizing Web browser...`);
        //telegramBot.sendMessage(botConfig.telegramChatId, `[${getCurrentTimestamp()}] Gamestop BOT Started!`);
        let page = await initBrowser();
        await checkStock(page);
    }catch(e)
    {
        console.log(e);
        console.log('Error occured - re-initalizing monitor.');
        monitor;
    }
}

initTelegram();

telegramBot.onText(/\/getid/, (msg, match) => {
    const chatId = msg.chat.id
    telegramBot.sendMessage(chatId, `Your chat id is: ${chatId}`)
  })

  telegramBot.onText(/\/lastcheck/, (msg, match) => {
    const chatId = msg.chat.id
    telegramBot.sendMessage(chatId, `Last Stock Checked: ${lastStockCheck}`)
  })

  telegramBot.onText(/\/debug/, (msg, match) => {
    const chatId = msg.chat.id
    if(telegramDebugMode)
        telegramDebugMode = false;
    else if(!telegramDebugMode)
        telegramDebugMode = true;
  })

monitor();