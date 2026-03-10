require('dotenv').config();
const express = require("express");
const mysql = require('mysql2/promise');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============= DATABASE CONNECTION POOL =============
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'football_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
};

let dbPool;

/**
 * Initialize database connection pool
 */
async function initializeDatabase() {
  try {
    dbPool = mysql.createPool(DB_CONFIG);
    console.log('✅ Database connection pool created');
    
    // Test connection
    const connection = await dbPool.getConnection();
    const [result] = await connection.execute('SELECT 1');
    connection.release();
    
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Make database pool globally accessible
global.dbPool = () => dbPool;

// ============= MIDDLEWARE =============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: function(origin, callback) {
    // Allow multiple development ports and production URL
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ============= HEALTH CHECK =============
app.get("/health", (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ============= API ROUTES =============
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: 'Football Field Booking API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: 'GET /health',
      users: 'GET/POST /api/users',
      docs: 'Documentation coming soon'
    }
  });
});

// ============= ERROR HANDLING =============
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// ============= START SERVER =============
async function startServer() {
  try {
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      console.error('Cannot start server without database connection');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (dbPool) {
    await dbPool.end();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

startServer();