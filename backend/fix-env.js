require('dotenv').config();
const fs = require('fs');

// Update env file to use the working database
const envContent = fs.readFileSync('.env', 'utf8');
const updatedEnv = envContent.replace('DB_NAME=football_booking_new', 'DB_NAME=football_booking');
fs.writeFileSync('.env', updatedEnv);

console.log('✅ Updated database name back to football_booking');

// Test connection
const { sequelize } = require('./src/models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Check if users table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'users'");
    if (results.length > 0) {
      console.log('✅ Users table exists');
    } else {
      console.log('❌ Users table missing, creating...');
      await sequelize.sync({ force: false });
      console.log('✅ Tables created successfully');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testConnection();
