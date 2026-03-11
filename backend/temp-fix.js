require('dotenv').config();
const fs = require('fs');

async function fixDatabase() {
  // Update env file to use new database
  const envContent = fs.readFileSync('.env', 'utf8');
  const updatedEnv = envContent.replace('DB_NAME=football_booking', 'DB_NAME=football_booking_new');
  fs.writeFileSync('.env', updatedEnv);

  console.log('✅ Updated database name to football_booking_new');

  // Now run the seed
  const { execSync } = require('child_process');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.log('⚠️  Seed failed, trying manual table creation...');
    
    // Create tables manually
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'football_booking_new'
    });
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        role ENUM('guest', 'player', 'captain', 'field_owner', 'admin') NOT NULL DEFAULT 'player',
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        avatarUrl VARCHAR(255),
        dateOfBirth DATE,
        gender ENUM('male', 'female', 'other'),
        address TEXT,
        emailVerified TINYINT(1) NOT NULL DEFAULT 0,
        lastLogin DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createUsersTable);
    console.log('✅ Users table created successfully!');
    
    await connection.end();
    console.log('🎉 Database is ready for registration!');
  }
}

fixDatabase();
