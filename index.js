const express = require('express');
const BedrockBot = require('./bot');
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 10000;

let botInstance = null;

app.get('/', (req, res) => {
  res.send('✅ Bedrock bot is running and healthy!');
});

app.get('/status', (req, res) => {
  res.json(botInstance ? botInstance.getStatus() : { isRunning: false });
});

app.listen(PORT, () => {
  console.log(`🌍 Web server active on port ${PORT}`);
  botInstance = new BedrockBot({
    host: config.server.host,
    port: config.server.port,
    username: config.bot.username
  });
});
