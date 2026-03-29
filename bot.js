const { createClient } = require('bedrock-protocol');
const logger = require('./utils/logger');
const config = require('./config.json');

class BedrockBot {
  constructor(serverConfig) {
    this.serverConfig = serverConfig;
    this.client = null;
    this.reconnectDelay = config.bot.reconnectDelay || 5000;
    this.isRunning = false;
    this.reconnectTimeout = null;

    this.connect();
  }

  connect() {
    logger.info('Attempting to connect to Bedrock server...');

    try {
      this.client = createClient({
        host: this.serverConfig.host,
        port: this.serverConfig.port,
        username: this.serverConfig.username,
        auth: 'microsoft',
        refreshToken: process.env.BEDROCK_REFRESH_TOKEN
      });

      this.setupEventHandlers();
      this.isRunning = true;
    } catch (error) {
      logger.error('Failed to create client:', error.message);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.client.on('join', () => {
      logger.info(`✅ Joined Bedrock server as ${this.client.username}`);
    });

    this.client.on('disconnect', (reason) => {
      logger.warn(`Bot disconnected: ${reason}`);
      this.cleanup();
      this.handleReconnect();
    });

    this.client.on('error', (err) => {
      logger.error(`Bot error: ${err.message}`);
      this.handleReconnect();
    });
  }

  handleReconnect() {
    logger.info(`Reconnecting in ${this.reconnectDelay / 1000} seconds...`);
    this.reconnectTimeout = setTimeout(() => {
      this.isRunning = false; // reset so connect() can run again
      this.connect();
    }, this.reconnectDelay);
  }

  cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  stop() {
    logger.info('Stopping bot...');
    this.isRunning = false;
    this.cleanup();
    if (this.client) {
      try {
        this.client.close();
      } catch (error) {
        logger.warn('Error during bot shutdown:', error.message);
      }
      this.client = null;
    }
    logger.info('Bot stopped successfully');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      username: this.client ? this.client.username : null
    };
  }
}

module.exports = BedrockBot;
