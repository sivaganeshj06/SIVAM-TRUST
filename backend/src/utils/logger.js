const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../audit.log');

const logEvent = (level, eventType, details) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${eventType}] - ${JSON.stringify(details)}\n`;
  
  // Print to console
  console.log(`[AUDIT] [${eventType}]`, details);
  
  // Append to audit log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error('Failed to write to audit log:', err.message);
  });
};

module.exports = {
  info: (eventType, details) => logEvent('info', eventType, details),
  warn: (eventType, details) => logEvent('warn', eventType, details),
  error: (eventType, details) => logEvent('error', eventType, details)
};
