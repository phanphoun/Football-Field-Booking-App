require('dotenv').config();
const path = require('path');

// Validate environment before continuing.
const validateEnvironment = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }
};

const defaultAllowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml'
];

const defaultAllowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

const configuredAllowedTypes = process.env.ALLOWED_FILE_TYPES
  ? process.env.ALLOWED_FILE_TYPES.split(',').map((item) => item.trim()).filter(Boolean)
  : defaultAllowedTypes;

const configuredAllowedExtensions = process.env.ALLOWED_FILE_EXTENSIONS
  ? process.env.ALLOWED_FILE_EXTENSIONS.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
  : defaultAllowedExtensions;

// Check whether allowed image upload is true.
const isAllowedImageUpload = (file = {}) => {
  const mimeType = String(file.mimetype || '').toLowerCase();
  const extension = path.extname(String(file.originalname || '')).toLowerCase();

  if (configuredAllowedTypes.includes(mimeType)) {
    return true;
  }

  return mimeType.startsWith('image/') && configuredAllowedExtensions.includes(extension);
};

const serverConfig = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database connection is now handled by config/database.js
  // This section removed to avoid duplication

  // Enhanced CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  },

  // Enhanced security configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-eval'", "https://accounts.google.com", "https://apis.google.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https:", "https://accounts.google.com", "https://oauth2.googleapis.com"],
          frameSrc: ["https://accounts.google.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    rateLimiting: {
      enabled: process.env.RATE_LIMITING !== 'false',
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Enhanced logging configuration
  logging: {
    enabled: process.env.HTTP_LOGGING !== 'false',
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'dev'),
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    colorize: process.env.NODE_ENV !== 'production'
  },

  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: configuredAllowedTypes,
    allowedExtensions: configuredAllowedExtensions,
    destination: process.env.UPLOAD_DESTINATION || 'uploads/'
  },
  isAllowedImageUpload
};

// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

module.exports = serverConfig;
