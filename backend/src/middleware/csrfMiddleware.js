const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  res.status(403).json({ 
    success: false, 
    message: 'CSRF token validation failed',
    errorCode: 'CSRF_VALIDATION_FAILED'
  });
};

module.exports = { csrfProtection, csrfErrorHandler, cookieParser };
