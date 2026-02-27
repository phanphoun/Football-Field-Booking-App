const { sequelize, User, Field } = require('../models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Reset DB

    const hashedPassword = await bcrypt.hash('Password123', 12);

    // Create Admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create Field Owner
    const owner = await User.create({
      username: 'owner1',
      email: 'owner@example.com',
      password: hashedPassword,
      firstName: 'Field',
      lastName: 'Owner',
      role: 'field_owner'
    });

    // Create Player
    const player = await User.create({
      username: 'player1',
      email: 'player@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Player',
      role: 'player'
    });

    // Create Field with all required fields
    await Field.create({
      name: 'Downtown Arena',
      description: 'A premium 5-a-side football field with floodlights.',
      address: '123 Main St',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      pricePerHour: 50.00,
      capacity: 10,
      surfaceType: 'artificial_turf',
      amenities: ['floodlights', 'showers', 'parking'],
      images: ['https://example.com/field1.jpg'],
      ownerId: owner.id
    });

    console.log('Database seeded successfully.');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('===================');
    console.log('👑 Admin User:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Password123');
    console.log('\n🏢 Field Owner:');
    console.log('   Email: owner@example.com');
    console.log('   Password: Password123');
    console.log('\n⚽ Player:');
    console.log('   Email: player@example.com');
    console.log('   Password: Password123');
    console.log('\n📝 Your registered user:');
    console.log('   Email: phanphoun855@gmail.com');
    console.log('   Password: Kanasaga123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();