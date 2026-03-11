require('dotenv').config();
const { sequelize } = require('./src/models');

async function debugDatabase() {
  try {
    console.log('🔍 Database Debug Report');
    console.log('========================');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_PORT: ${process.env.DB_PORT}`);
    console.log(`DB_USER: ${process.env.DB_USER}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'EMPTY'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '***' : 'MISSING'}`);
    console.log('');
    
    // Test database connection
    console.log('🔌 Testing Database Connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Check if User table exists
    console.log('📊 Checking Database Tables...');
    const [results] = await sequelize.query("SHOW TABLES LIKE 'Users'");
    if (results.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('💡 Running database sync...');
      await sequelize.sync({ force: false });
      console.log('✅ Database synced successfully!');
    } else {
      console.log('✅ Users table exists');
      
      // Check existing users
      const { User } = require('./src/models');
      const userCount = await User.count();
      console.log(`👥 Current user count: ${userCount}`);
    }
    
    console.log('');
    console.log('🎉 Database is ready for registration!');
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('');
    console.log('🔧 Possible Solutions:');
    console.log('1. Make sure MySQL is running in XAMPP');
    console.log('2. Check your .env file credentials');
    console.log('3. Create the database manually:');
    console.log(`   CREATE DATABASE ${process.env.DB_NAME || 'football_booking'};`);
    console.log('4. Run: npm run seed');
  } finally {
    await sequelize.close();
  }
}

debugDatabase();
