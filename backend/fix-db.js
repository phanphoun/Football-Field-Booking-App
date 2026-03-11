require('dotenv').config();
const { sequelize } = require('./src/models');

async function fixDatabase() {
  try {
    console.log('🔧 Fixing Database Tables...');
    
    // Drop all tables to fix tablespace issue
    console.log('🗑️  Dropping existing tables...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = ['users', 'teams', 'fields', 'bookings', 'team_members', 'role_requests'];
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✅ Dropped ${table} table`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.message}`);
      }
    }
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Recreate all tables
    console.log('🏗️  Recreating database tables...');
    await sequelize.sync({ force: false });
    
    // Check if User table was created
    const [results] = await sequelize.query("SHOW TABLES LIKE 'users'");
    if (results.length > 0) {
      console.log('✅ Users table created successfully!');
      
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
      await testUser.destroy(); // Clean up test user
      
      console.log('🎉 Database is now ready for registration!');
    } else {
      console.log('❌ Users table still not created');
    }
    
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixDatabase();
