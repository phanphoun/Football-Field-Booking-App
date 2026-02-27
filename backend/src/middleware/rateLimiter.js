const rateLimit = require('express-rate-limit');

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
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later'
      });
    }
  });
};

// General API rate limiting (increased for development)
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests per window (effectively disabled for dev)
  'Too many requests from this IP, please try again after 15 minutes'
);

// Strict rate limiting for authentication routes (disabled for development)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 attempts per window (effectively disabled for dev)
  'Too many authentication attempts, please try again after 15 minutes'
);

// Rate limiting for search endpoints (increased for development)
const searchLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  300, // 300 searches per minute (effectively disabled for dev)
  'Too many search requests, please try again after a minute'
);

// Rate limiting for creation endpoints (increased for development)
const createLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 creations per minute (effectively disabled for dev)
  'Too many creation requests, please try again after a minute'
);

module.exports = {
  generalLimiter,
  authLimiter,
  searchLimiter,
  createLimiter
};
