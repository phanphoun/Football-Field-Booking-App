const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Try to get token from httpOnly cookie first (preferred)
    let token = req.cookies?.token;

    // Fallback to Authorization header for legacy clients
    if (!token) {
      const authHeader = req.header('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ..., role: ... }
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired.'
      });
    } else {
      // Don't log full error in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Authentication error:', error.message);
      }
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error during authentication.' 
      });
    }
  }
};

module.exports = auth;