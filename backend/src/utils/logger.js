const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple logger utility (Winston can be added later for production)
 * Logs to console in development and to files in production
 */
const logger = {
  /**
   * Log error level messages
   */
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    const fullLog = {
      timestamp,
      level: 'ERROR',
      message,
      ...meta
    };

    // Console in dev, suppress in prod
    if (process.env.NODE_ENV === 'development') {
      console.error(logMessage, meta);
    }

    // Write to file
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'error.log'),
        JSON.stringify(fullLog) + '\n'
      );
    }
  },

  /**
   * Log warning level messages
   */
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}`;
    const fullLog = {
      timestamp,
      level: 'WARN',
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn(logMessage, meta);
    }

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'combined.log'),
        JSON.stringify(fullLog) + '\n'
      );
    }
  },

  /**
   * Log info level messages
   */
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}`;
    const fullLog = {
      timestamp,
      level: 'INFO',
      message,
      ...meta
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage, meta);
    }

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'combined.log'),
        JSON.stringify(fullLog) + '\n'
      );
    }
  },

  /**
   * Log debug level messages (development only)
   */
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] DEBUG: ${message}`;
      console.log(logMessage, meta);
    }
  },

  /**
   * Log HTTP requests
   */
  http: (method, path, statusCode, duration, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${method} ${path} - ${statusCode} (${duration}ms)`;
    const fullLog = {
      timestamp,
      level: 'HTTP',
      method,
      path,
      statusCode,
      duration,
      ...meta
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(logMessage);
    }

    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(
        path.join(logsDir, 'http.log'),
        JSON.stringify(fullLog) + '\n'
      );
    }
  }
};

module.exports = logger;
