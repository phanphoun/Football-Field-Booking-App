const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Log rate limit violations
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later'
      });
    }
  });
};

// Define different limits for development and production
const limits = {
  dev: {
    general: { window: 15 * 60 * 1000, max: 1000 },      // Very lenient for dev
    auth: { window: 15 * 60 * 1000, max: 1000 },
    search: { window: 1 * 60 * 1000, max: 300 },
    create: { window: 1 * 60 * 1000, max: 100 }
  },
  production: {
    general: { window: 15 * 60 * 1000, max: 100 },      // Standard API rate limit
    auth: { window: 15 * 60 * 1000, max: 5 },           // Strict: 5 attempts per 15 min
    search: { window: 1 * 60 * 1000, max: 30 },         // 30 searches per minute
    create: { window: 1 * 60 * 1000, max: 20 }          // 20 creations per minute
  }
};

const currentLimits = process.env.NODE_ENV === 'production' ? limits.production : limits.dev;

// General API rate limiting
const generalLimiter = createRateLimiter(
  currentLimits.general.window,
  currentLimits.general.max,
  'Too many requests from this IP, please try again later'
);

// Strict rate limiting for authentication routes (prevents brute force)
const authLimiter = createRateLimiter(
  currentLimits.auth.window,
  currentLimits.auth.max,
  'Too many authentication attempts, please try again after 15 minutes'
);

// Rate limiting for search endpoints
const searchLimiter = createRateLimiter(
  currentLimits.search.window,
  currentLimits.search.max,
  'Too many search requests, please try again after a minute'
);

// Rate limiting for creation endpoints
const createLimiter = createRateLimiter(
  currentLimits.create.window,
  currentLimits.create.max,
  'Too many creation requests, please try again after a minute'
);

module.exports = {
  generalLimiter,
  authLimiter,
  searchLimiter,
  createLimiter
};
