require('dotenv').config();
const mysql = require('mysql2/promise');

async function quickFixDatabase() {
  try {
    console.log('🔧 Quick Database Fix...');
    
    // Connect to MySQL without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('🗑️  Dropping and recreating database...');
    
    // Drop and recreate database
    await connection.execute('DROP DATABASE IF EXISTS football_booking');
    await connection.execute('CREATE DATABASE football_booking');
    
    console.log('✅ Database recreated successfully!');
    
    // Close connection
    await connection.end();
    
    // Now run the seed
    console.log('🌱 Running database seed...');
    const { execSync } = require('child_process');
    try {
      execSync('npm run seed', { stdio: 'inherit' });
      console.log('🎉 Database is ready!');
    } catch (error) {
      console.log('⚠️  Seed failed, but database is ready');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickFixDatabase();
