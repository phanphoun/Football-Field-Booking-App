const { Sequelize } = require('sequelize');

// Database configuration for MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'football_booking',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
    dialectOptions: {
      connectTimeout: 60000,
      multipleStatements: false
    },
    retry: {
      max: 3,
      timeout: 5000
    }
  }
);

// Test the connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('MySQL connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('Unable to connect to the database after retries:', error);
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

// Monitor database connection
const monitorConnection = () => {
  sequelize.addHook('beforeConnect', () => {
    console.log('Connecting to database...');
  });

  sequelize.addHook('afterConnect', () => {
    console.log('Database connected successfully.');
  });

  sequelize.addHook('beforeDisconnect', () => {
    console.log('Disconnecting from database...');
  });

  sequelize.addHook('afterDisconnect', () => {
    console.log('Database disconnected.');
  });
};

// Auto-test connection in development
if (process.env.NODE_ENV === 'development') {
  testConnection().catch(err => {
    console.error('Initial database connection failed:', err);
  });
  monitorConnection();
}

module.exports = sequelize;
