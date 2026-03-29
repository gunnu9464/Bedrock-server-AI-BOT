const config = require('../config.json');

function formatMessage(level, message, ...args) {
  const timestamp = config.logging.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
  return `${timestamp}${level.toUpperCase()}: ${message} ${args.join(' ')}`;
}

module.exports = {
  info: (msg, ...args) => console.log(formatMessage('info', msg, ...args)),
  warn: (msg, ...args) => console.warn(formatMessage('warn', msg, ...args)),
  error: (msg, ...args) => console.error(formatMessage('error', msg, ...args)),
  debug: (msg, ...args) => {
    if (config.logging.level === 'debug') {
      console.log(formatMessage('debug', msg, ...args));
    }
  }
};
