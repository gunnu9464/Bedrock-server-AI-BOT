const { createClient } = require('bedrock-protocol');
const logger = require('./utils/logger');
const config = require('./config.json');

class BedrockBot {
  constructor(serverConfig) {
    this.serverConfig = serverConfig;
    this.client = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.bot.maxReconnectAttempts;
    this.reconnectDelay = config.bot.reconnectDelay;
    this.isRunning = false;
    this.reconnectTimeout = null;

    this.connect();
  }

  connect() {
    if (this.isRunning) {
      logger.warn('Bot is already running, skipping connection attempt');
      return;
    }

    logger.info('Attempting to connect to Bedrock server...');

    try {
      this.client = createClient({
      host: this.serverConfig.host,
      port: this.serverConfig.port,
      username: this.serverConfig.username,   // <-- comma here
      auth: 'microsoft',                      // <-- comma here
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
      this.reconnectAttempts = 0;
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
    if (!this.isRunning) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Stopping bot.`);
      this.stop();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay;
    logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000} seconds...`);

    this.reconnectTimeout = setTimeout(() => this.connect(), delay);
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
      try { this.client.close(); }
      catch (error) { logger.warn('Error during bot shutdown:', error.message); }
      this.client = null;
    }
    logger.info('Bot stopped successfully');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      username: this.client ? this.client.username : null
    };
  }
}

module.exports = BedrockBot;
