const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { sequelize } = require('./src/models');
const serverConfig = require('./src/config/serverConfig');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { generalLimiter, authLimiter, searchLimiter, createLimiter } = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const fieldRoutes = require('./src/routes/fieldRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const teamMemberRoutes = require('./src/routes/teamMemberRoutes');
const publicTeamRoutes = require('./src/routes/publicTeamRoutes');
const matchResultRoutes = require('./src/routes/matchResultRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = serverConfig.port;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(serverConfig.security.helmet));
app.use(cors(serverConfig.cors));
app.use(compression());

// Rate limiting
if (serverConfig.security.rateLimiting.enabled) {
  app.use(generalLimiter);
}

// Logging middleware
app.use(morgan(serverConfig.logging.format));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============= API ROUTES =============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: serverConfig.nodeEnv,
    version: '2.0.0'
  });
});

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
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
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        search: 'GET /api/dashboard/search'
      }
    }
  });
});

// Apply authentication rate limiting
app.use('/api/auth', authLimiter);

// Apply search rate limiting
app.use('/api/dashboard/search', searchLimiter);

// Apply creation rate limiting
app.use('/api', createLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/public/teams', publicTeamRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/match-results', matchResultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

// ============= Start Server =============
const startServer = async () => {
  try {
    // Database connection check
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    
    // Environment-safe database sync
    const isDevelopment = serverConfig.nodeEnv === 'development';
    const isTest = serverConfig.nodeEnv === 'test';
    
    // Attempt to synchronize schema, but don't crash the server if sync fails.
    if (isDevelopment) {
      console.log('🔄 Development mode: Synchronizing database schema (alter)...');
      try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database schema synchronized successfully (alter applied).');
      } catch (syncErr) {
        console.warn('⚠️ Schema sync (alter) failed:', syncErr.message);
        console.warn('⚠️ Continuing to start server without completing schema alterations.');
      }
    } else if (isTest) {
      console.log('🧪 Test mode: Recreating database...');
      try {
        await sequelize.sync({ force: true });
        console.log('✅ Test database recreated successfully.');
      } catch (syncErr) {
        console.warn('⚠️ Test DB sync (force) failed:', syncErr.message);
        console.warn('⚠️ Continuing to start server despite test DB sync failure.');
      }
    } else {
      console.log('🚀 Production mode: Synchronizing database safely...');
      try {
        await sequelize.sync();
        console.log('✅ Database synchronized safely.');
      } catch (syncErr) {
        console.warn('⚠️ Production DB sync failed:', syncErr.message);
        console.warn('⚠️ Continuing to start server despite sync failure.');
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${serverConfig.nodeEnv}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('💡 Please check your database configuration and ensure MySQL is running.');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
