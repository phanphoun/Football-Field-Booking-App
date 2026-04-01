// ============================================
// 🏈 Football Field Booking API Server
// ============================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const axios = require('axios');

// ============================================
// 📦 Imports
// ============================================

// Core imports
const { sequelize, Field } = require('./src/models');
const serverConfig = require('./src/config/serverConfig');
const logger = require('./src/utils/logger');
const { getPublicRoot, getPublicAssetPath, getUploadRoot } = require('./src/utils/storagePaths');

// Middleware imports
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { generalLimiter, authLimiter, searchLimiter, createLimiter } = require('./src/middleware/rateLimiter');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const fieldRoutes = require('./src/routes/fieldRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const teamMemberRoutes = require('./src/routes/teamMemberRoutes');
const publicTeamRoutes = require('./src/routes/publicTeamRoutes');
const publicScheduleRoutes = require('./src/routes/publicScheduleRoutes');
const matchResultRoutes = require('./src/routes/matchResultRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const realtimeRoutes = require('./src/routes/realtimeRoutes');
const ownerMvpRoutes = require('./src/routes/ownerMvpRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

// ============================================
// ⚙️ Configuration
// ============================================

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = "https://api.football-data.org/v4";
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Bangkok";

const leagues = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "BL1", name: "Bundesliga" },
  { code: "FL1", name: "Ligue 1" }
];

// ============================================
// 🛠️ Utility Functions
// ============================================

const formatDateKeyInTimezone = (value, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date(value));
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  const day = Number(parts.find(part => part.type === "day")?.value);
  
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getTodayAnchorInTimezone = (timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  const day = Number(parts.find(part => part.type === "day")?.value);
  
  return new Date(Date.UTC(year, month - 1, day));
};

// Simple in-memory cache
const leagueCache = { standings: new Map() };
const setCachedValue = (cacheMap, key, value, ttlMs) => {
  cacheMap.set(key, { value, expires: Date.now() + ttlMs });
};
const getCachedValue = (cacheMap, key) => {
  const cached = cacheMap.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  cacheMap.delete(key);
  return null;
};

// ============================================
// 🚀 Express App Setup
// ============================================

const app = express();
const PORT = serverConfig.port;
const publicRoot = getPublicRoot();
const uploadRoot = getUploadRoot();
const frontendIndexPath = path.join(publicRoot, 'index.html');

const hasFrontendBundle = () => fs.existsSync(frontendIndexPath);

const getApiOverview = () => ({
  message: 'Football Field Booking API',
  version: '2.0.0',
  environment: serverConfig.nodeEnv,
  endpoints: {
    health: 'GET /health',
    auth: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile',
      updateProfile: 'PUT /api/auth/profile'
    },
    users: '/api/users',
    fields: '/api/fields',
    bookings: '/api/bookings',
    teams: '/api/teams',
    publicTeams: '/api/public/teams',
    teamMembers: '/api/team-members',
    matchResults: '/api/match-results',
    notifications: '/api/notifications',
    ratings: '/api/ratings',
    dashboard: '/api/dashboard',
    payments: '/api/payments',
    realtime: '/api/realtime/stream',
    ownerMvp: '/api/owner-mvp',
    chat: '/api/chat'
  }
});

// ============================================
// 🛡️ Middleware Setup
// ============================================

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(cors(serverConfig.cors));
app.use(helmet(serverConfig.security.helmet));
app.use(compression());

// Rate limiting
if (serverConfig.security.rateLimiting.enabled) {
  app.use(generalLimiter);
}

// Logging middleware
if (serverConfig.logging.enabled) {
  app.use(morgan(serverConfig.logging.format));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  next();
});

// Serve static uploads
app.use('/uploads', express.static(uploadRoot, {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
  onError: (err, req, res) => {
    console.error('Static file error for', req.path, ':', err);
    res.status(404).json({ error: 'File not found' });
  }
}));

app.use(express.static(publicRoot, { index: false, redirect: false }));

// ============================================
// 🖼️ Image Fallback Handler
// ============================================

const sendMissingFieldImageFallback = (req, res, next) => {
  const requestedPath = decodeURIComponent(req.path || '').replace(/^\/+/, '');
  
  if (!requestedPath) {
    return next();
  }

  const candidateFiles = [
    path.join(uploadRoot, 'field', requestedPath),
    path.join(uploadRoot, 'fields', requestedPath)
  ];
  
  const hasAnyCandidate = candidateFiles.some((absolutePath) => fs.existsSync(absolutePath));
  
  if (hasAnyCandidate) {
    return next();
  }

  const fallbackImage = getPublicAssetPath('hero-manu.jpg');
  return res.sendFile(fallbackImage);
};

app.use('/uploads/field', sendMissingFieldImageFallback);
app.use('/uploads/fields', sendMissingFieldImageFallback);

// ============================================
// 🏥 Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: serverConfig.nodeEnv,
    version: '2.0.0'
  });
});

// API overview
app.get('/', (req, res) => res.json(getApiOverview()));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/public/teams', publicTeamRoutes);
app.use('/api/public/schedule', publicScheduleRoutes);
app.use('/api/match-results', matchResultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/owner-mvp', ownerMvpRoutes);
app.use('/api/chats', chatRoutes);

// ============================================
// ⚽ External Football API Routes
// ============================================

// League matches endpoint
app.get("/api/matches", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({ error: 'League data service is unavailable. API key not configured.' });
  }
  
  try {
    const { league } = req.query;
    const cacheKey = `matches-${league || 'all'}`;
    
    let matches = getCachedValue(leagueCache.standings, cacheKey);
    
    if (!matches) {
      const url = league 
        ? `${BASE_URL}/matches?league=${league}&season=2024`
        : `${BASE_URL}/matches?season=2024`;
        
      const response = await axios.get(url, {
        headers: { 'X-Auth-Token': API_KEY }
      });
      
      matches = response.data.matches || [];
      setCachedValue(leagueCache.standings, cacheKey, matches, 5 * 60 * 1000);
    }
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// League standings endpoint
app.get("/api/leagues/standings", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({ error: 'League data service is unavailable. API key not configured.' });
  }
  
  try {
    const { league } = req.query;
    const cacheKey = `standings-${league || 'all'}`;
    
    let standingsByLeague = {};
    
    for (const leagueData of leagues) {
      const cacheKey = `standings-${leagueData.code}`;
      
      let formattedStandings = getCachedValue(leagueCache.standings, cacheKey);
      
      if (!formattedStandings) {
        const url = `${BASE_URL}/standings?league=${leagueData.code}&season=2024`;
        const response = await axios.get(url, {
          headers: { 'X-Auth-Token': API_KEY }
        });
        
        const standings = response.data.standings || [];
        formattedStandings = standings.map(team => ({
          rank: team.rank,
          team: team.team,
          played: team.played,
          won: team.won,
          drawn: team.drawn,
          lost: team.lost,
          goalsFor: team.goalsFor,
          goalsAgainst: team.goalsAgainst,
          goalDifference: team.goalsFor - team.goalsAgainst,
          points: team.points
        }));
        
        standingsByLeague[leagueData.code] = formattedStandings;
        setCachedValue(leagueCache.standings, cacheKey, formattedStandings, 5 * 60 * 1000);
      }
    }
    
    res.json(standingsByLeague);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 🌐 Frontend Serving
// ============================================

// Favicon route
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Login route (redirect to auth login)
app.get('/login', (req, res) => {
  res.redirect('/api/auth/login');
});

app.get(/.*/, (req, res, next) => {
  const isReservedRoute =
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/uploads') ||
    req.path === '/health' ||
    req.path === '/favicon.ico' ||
    req.path === '/login';

  if (isReservedRoute || path.extname(req.path) || !req.accepts('html') || !hasFrontendBundle()) {
    return next();
  }

  return res.sendFile(frontendIndexPath);
});

// ============================================
// 🚨 Error Handling
// ============================================

app.use(notFound);
app.use(errorHandler);

// ============================================
// 🚀 Server Start
// ============================================

const startServer = async () => {
  let server = null;
  
  try {
    // Database connection with retry logic
    logger.info('Attempting to connect to database...');
    await sequelize.authenticate();
    logger.info('Database connected successfully.');
    
    // Environment-safe database sync
    const isDevelopment = serverConfig.nodeEnv === 'development';
    const isTest = serverConfig.nodeEnv === 'test';
    const enableAlterSync = process.env.DB_SYNC_ALTER === 'true';
    
    // Development mode
    if (isDevelopment) {
      if (enableAlterSync) {
        logger.info('Development mode: Synchronizing database schema (alter enabled)...');
        try {
          await sequelize.sync({ alter: true });
          logger.info('Database schema synchronized successfully (alter applied).');
        } catch (syncErr) {
          logger.warn('Schema sync failed: ' + syncErr.message);
          logger.warn('Continuing to start server despite sync failure.');
        }
      } else {
        logger.info('Development mode: Safe sync (set DB_SYNC_ALTER=true to enable alter sync).');
        try {
          await sequelize.sync();
          logger.info('Database schema synchronized safely.');
        } catch (syncErr) {
          logger.warn('Schema sync failed: ' + syncErr.message);
          logger.warn('Continuing to start server despite sync failure.');
        }
      }
    } 
    // Test mode
    else if (isTest) {
      logger.info('Test mode: Recreating database...');
      try {
        await sequelize.sync({ force: true });
        logger.info('Test database recreated successfully.');
      } catch (syncErr) {
        logger.warn('Test DB sync (force) failed: ' + syncErr.message);
        logger.warn('Continuing to start server despite test DB sync failure.');
      }
    } 
    // Production mode
    else {
      logger.info('Production mode: Synchronizing database safely...');
      try {
        await sequelize.sync();
        logger.info('Database schema synchronized safely.');
      } catch (syncErr) {
        logger.warn('Production schema sync failed: ' + syncErr.message);
        logger.warn('Continuing to start server despite sync failure.');
      }
    }
    
    // Start server with error handling
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${serverConfig.nodeEnv}`);
      logger.info(`API Documentation: http://localhost:${PORT}/`);
      logger.info(`Started at: ${new Date().toISOString()}`);
      console.log(`Server is running on port: http://localhost:${PORT}/`);
      
      // Add debugging
      console.log('DEBUG: Server started successfully, keeping process alive...');
      
      // Keep the event loop alive
      const keepAlive = setInterval(() => {
        // This interval keeps the Node.js process alive
      }, 60000); // Every minute
      
      app.set('keepAlive', keepAlive);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string'
        ? 'Pipe ' + PORT
        : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Add health monitoring
    const healthCheck = setInterval(async () => {
      try {
        await sequelize.authenticate();
        // Database is healthy
      } catch (error) {
        logger.error('Health check failed - database connection lost:', error.message);
        // Attempt to reconnect
        try {
          await sequelize.authenticate();
          logger.info('Database reconnection successful');
        } catch (reconnectError) {
          logger.error('Database reconnection failed:', reconnectError.message);
        }
      }
    }, 30000); // Check every 30 seconds

    // Store server reference for graceful shutdown
    app.set('server', server);
    app.set('healthCheck', healthCheck);
    
  } catch (error) {
    const errorMessage = error?.message || error?.toString?.() || 'Unknown database connection error';
    logger.error('Unable to connect to the database.');
    logger.error(`Error details: ${errorMessage}`);

    if (serverConfig.nodeEnv === 'development' && error?.stack) {
      logger.error(error.stack);
    }

    // Exit gracefully - let nodemon handle restarts if needed
    logger.error('Server startup failed. Exiting...');
    process.exit(1);
  }
};

// ============================================
// � Global Error Handlers
// ============================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  console.error('Uncaught Exception:', error);
  // Don't exit in development with nodemon, just log
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development with nodemon, just log
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  gracefulShutdown();
});

const gracefulShutdown = async () => {
  try {
    logger.info('Starting graceful shutdown...');
    
    // Clear health check interval
    const healthCheck = app.get('healthCheck');
    if (healthCheck) {
      clearInterval(healthCheck);
      logger.info('Health monitoring stopped.');
    }
    
    // Clear keep alive interval
    const keepAlive = app.get('keepAlive');
    if (keepAlive) {
      clearInterval(keepAlive);
      logger.info('Keep alive interval stopped.');
    }
    
    // Close HTTP server
    const server = app.get('server');
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed.');
      });
    }
    
    // Close database connections
    logger.info('Closing database connections...');
    await sequelize.close();
    logger.info('Database connections closed.');
    
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// ============================================
// �� Start Application
// ============================================

// Warn if API key is missing
if (!API_KEY) {
  logger.warn('FOOTBALL_API_KEY not set. League features will be disabled.');
}

// Start the server
startServer();

module.exports = app;
