/**
 * Enhanced logger utility with file logging capability
 */
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `bot_${new Date().toISOString().split('T')[0]}.log`);

const logger = {
  info: (message) => {
    const logMessage = `[INFO] ${new Date().toISOString()}: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  
  error: (message) => {
    const logMessage = `[ERROR] ${new Date().toISOString()}: ${message}`;
    console.error(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  
  warn: (message) => {
    const logMessage = `[WARN] ${new Date().toISOString()}: ${message}`;
    console.warn(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  
  debug: (message) => {
    const logMessage = `[DEBUG] ${new Date().toISOString()}: ${message}`;
    console.debug(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  }
};

module.exports = logger;
