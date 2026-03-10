


// config.js
const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'football_booking',
  },
  api: {
    url: process.env.API_URL || 'http://localhost:3000'
  }
};

module.exports = { config };