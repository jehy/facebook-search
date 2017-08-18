const
  TelegramBot = require('node-telegram-bot-api'),
  config = require('./config/config.json'),
  Promise = require('bluebird'),
  searchUsers = require('./searchUsers');


const token = config.telegram.token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
const auth = {};
bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error.code}`);  // => 'EFATAL'
  console.log(error);
});

bot.on('webhook_error', (error) => {
  console.log(`Webhook error: ${error.code}`);  // => 'EPARSE'
});

// Matches "/echo [whatever]"
bot.onText(/\/start/, (msg, match) => {
  console.log('start');
  const chatId = msg.chat.id || msg.from.id;
  bot.sendMessage(chatId, 'Please use /hello and /search commands');
});

bot.onText(/\/hello (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const pass = match[1]; // the captured "whatever"

  if (pass === 'genie') {
    auth[msg.chat.id] = true;
    auth[msg.from.id] = true;
    bot.sendMessage(chatId, 'Auth ok');
  }
  else {
    bot.sendMessage(chatId, 'Wrong hello message!');
  }
});


bot.onText(/\/search (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const search = match[1]; // the captured "whatever"

  if (!(auth[msg.chat.id] || auth[msg.from.id])) {
    bot.sendMessage(chatId, 'Please say hello first!');
    return;
  }

  bot.sendMessage(chatId, 'Please wait a bit, the best of our people are processing your query!');
  const sendQueue = Promise.resolve().delay(2000);
  searchUsers(search).then((result) => {
    sendQueue.then(() => {
      bot.sendMessage(chatId, result.text);
    });

    if (result.images.length) {
      result.images.forEach((img) => {
        sendQueue.delay(2000).then(() => {
          bot.sendDocument(msg.chat.id, img);
        });
      });
    }
    if (result.files.length) {
      result.files.forEach((file) => {
        sendQueue.delay(2000).then(() => {
          bot.sendDocument(msg.chat.id, file);
        });
      });
    }
  })
    .catch((err) => {
      sendQueue.then(() => {
        bot.sendMessage(chatId, `There was an error: ${err.toString()}`);
      });
    });
});
