const fs = require('fs');

let json = JSON.parse(fs.readFileSync("bot-config.json"));
console.log(json.gameStopProducts[0]);