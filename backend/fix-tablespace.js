require('dotenv').config();
const { sequelize } = require('./src/models');

async function fixTablespace() {
  try {
    console.log('🔧 Fixing MySQL Tablespace Issue...');
    
    // Force drop the tablespace
    console.log('🗑️  Discarding tablespace...');
    await sequelize.query('DROP TABLE IF EXISTS `users`');
    await sequelize.query('DROP TABLE IF EXISTS `teams`');
    await sequelize.query('DROP TABLE IF EXISTS `fields`');
    await sequelize.query('DROP TABLE IF EXISTS `bookings`');
    await sequelize.query('DROP TABLE IF EXISTS `team_members`');
    await sequelize.query('DROP TABLE IF EXISTS `role_requests`');
    
    // Discard tablespace for each table
    const tables = ['users', 'teams', 'fields', 'bookings', 'team_members', 'role_requests'];
    for (const table of tables) {
      try {
        await sequelize.query(`ALTER TABLE \`${table}\` DISCARD TABLESPACE`);
        console.log(`✅ Discarded tablespace for ${table}`);
      } catch (error) {
        // Table doesn't exist, which is fine
        console.log(`⚠️  Could not discard tablespace for ${table}: ${error.message}`);
      }
    }
    
    // Try a different approach - create a fresh database
    console.log('🔄 Creating fresh database...');
    await sequelize.query('DROP DATABASE IF EXISTS `football_booking`');
    await sequelize.query('CREATE DATABASE `football_booking`');
    await sequelize.query('USE `football_booking`');
    
    // Now sync models
    console.log('🏗️  Creating tables...');
    await sequelize.sync({ force: false });
    
    // Test user creation
    const { User } = require('./src/models');
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'player'
    });
    
    console.log('✅ Test user created successfully!');
    await testUser.destroy(); // Clean up
    
    console.log('🎉 Database is now ready for registration!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 Manual Fix Required:');
    console.log('1. Open MySQL Workbench or phpMyAdmin');
    console.log('2. Run these commands:');
    console.log('   DROP DATABASE IF EXISTS football_booking;');
    console.log('   CREATE DATABASE football_booking;');
    console.log('3. Then run: npm run seed');
  } finally {
    await sequelize.close();
  }
}

fixTablespace();
