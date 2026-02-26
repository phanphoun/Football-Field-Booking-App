const { sequelize, User, Field } = require('../models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Reset DB

    const hashedPassword = await bcrypt.hash('password123', 8);

    // Create Admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Create Field Owner
    const owner = await User.create({
      username: 'owner1',
      email: 'owner@example.com',
      password: hashedPassword,
      role: 'field_owner'
    });

    // Create Player
    const player = await User.create({
      username: 'player1',
      email: 'player@example.com',
      password: hashedPassword,
      role: 'player'
    });

    // Create Field
    await Field.create({
      name: 'Downtown Arena',
      location: '123 Main St',
      description: 'A premium 5-a-side football field with floodlights.',
      price: 50.00,
      ownerId: owner.id,
      images: ['https://example.com/field1.jpg']
    });

    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();