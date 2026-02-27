const { sequelize, User, Field, Team, TeamMember } = require('../models');
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

    // Create Captains
    const captain1 = await User.create({
      username: 'captain1',
      email: 'captain1@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Captain',
      role: 'captain'
    });

    const captain2 = await User.create({
      username: 'captain2',
      email: 'captain2@example.com',
      password: hashedPassword,
      firstName: 'Second',
      lastName: 'Captain',
      role: 'captain'
    });

    // Create Players
    const player1 = await User.create({
      username: 'player1',
      email: 'player@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Player',
      role: 'player'
    });

    const player2 = await User.create({
      username: 'player2',
      email: 'player2@example.com',
      password: hashedPassword,
      firstName: 'Second',
      lastName: 'Player',
      role: 'player'
    });

    // Create Fields
    const field1 = await Field.create({
      name: 'Downtown Arena',
      description: 'A premium 5-a-side football field with floodlights.',
      address: '123 Main St',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      pricePerHour: 50.0,
      capacity: 10,
      fieldType: '5v5',
      surfaceType: 'artificial_turf',
      amenities: ['floodlights', 'showers', 'parking'],
      images: ['https://example.com/field1.jpg'],
      ownerId: owner.id,
      rating: 4.7,
      totalRatings: 31
    });

    const field2 = await Field.create({
      name: 'Riverside Stadium',
      description: 'Spacious outdoor field with great lighting and seating.',
      address: '456 Riverside Rd',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      pricePerHour: 70.0,
      capacity: 22,
      fieldType: '11v11',
      surfaceType: 'natural_grass',
      amenities: ['parking', 'water', 'seating'],
      images: ['https://example.com/field2.jpg'],
      ownerId: owner.id,
      rating: 4.3,
      totalRatings: 12
    });

    // Create Teams
    const team1 = await Team.create({
      name: 'Downtown FC',
      description: 'Friendly team playing weekly games.',
      captainId: captain1.id,
      skillLevel: 'intermediate',
      maxPlayers: 15,
      homeFieldId: field1.id,
      isActive: true
    });

    const team2 = await Team.create({
      name: 'Night Owls United',
      description: 'Evening matches and competitive spirit.',
      captainId: captain2.id,
      skillLevel: 'advanced',
      maxPlayers: 18,
      homeFieldId: field2.id,
      isActive: true
    });

    // Team memberships (active + pending request demo)
    await TeamMember.bulkCreate([
      {
        teamId: team1.id,
        userId: captain1.id,
        role: 'captain',
        status: 'active',
        isActive: true
      },
      {
        teamId: team2.id,
        userId: captain2.id,
        role: 'captain',
        status: 'active',
        isActive: true
      },
      {
        teamId: team1.id,
        userId: player1.id,
        role: 'player',
        status: 'active',
        isActive: true
      },
      {
        teamId: team1.id,
        userId: player2.id,
        role: 'player',
        status: 'pending',
        isActive: true
      }
    ]);

    console.log('Database seeded successfully.');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('===================');
    console.log('👤 Admin User:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Password123');
    console.log('\n🏢 Field Owner:');
    console.log('   Email: owner@example.com');
    console.log('   Password: Password123');
    console.log('\n🎽 Captain 1:');
    console.log('   Email: captain1@example.com');
    console.log('   Password: Password123');
    console.log('\n🎽 Captain 2:');
    console.log('   Email: captain2@example.com');
    console.log('   Password: Password123');
    console.log('\n⚽ Player 1:');
    console.log('   Email: player@example.com');
    console.log('   Password: Password123');
    console.log('\n⚽ Player 2:');
    console.log('   Email: player2@example.com');
    console.log('   Password: Password123');

    console.log('\n📌 DEMO:');
    console.log(`   Team "${team1.name}" has a pending join request from "${player2.username}"`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

