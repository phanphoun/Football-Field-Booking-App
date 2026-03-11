const { sequelize, User, Field, Team, TeamMember, Booking } = require('../models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await sequelize.sync({ force: true }); // Reset DB
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

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

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c85dc3b141aa419b615abd61c2b72a31a204f06d
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
<<<<<<< HEAD
        status: 'accepted',
=======
    // Create 10 Fields
    const fields = await Field.bulkCreate([
      {
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
        ownerId: owner1.id,
        rating: 4.7,
        totalRatings: 31
      },
      {
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
        ownerId: owner1.id,
        rating: 4.3,
        totalRatings: 12
      },
      {
        name: 'City Sports Complex',
        description: 'Modern indoor facility with climate control.',
        address: '789 Sports Ave',
        city: 'Phnom Penh',
        province: 'Phnom Penh',
        pricePerHour: 60.0,
        capacity: 12,
        fieldType: '7v7',
        surfaceType: 'artificial_turf',
        amenities: ['climate_control', 'showers', 'lockers'],
        images: ['https://example.com/field3.jpg'],
        ownerId: owner2.id,
        rating: 4.5,
        totalRatings: 18
      },
      {
        name: 'Golden Field Park',
        description: 'Premium outdoor field with professional lighting.',
        address: '321 Golden St',
        city: 'Siem Reap',
        province: 'Siem Reap',
        pricePerHour: 55.0,
        capacity: 16,
        fieldType: '8v8',
        surfaceType: 'hybrid_turf',
        amenities: ['floodlights', 'parking', 'bleachers'],
        images: ['https://example.com/field4.jpg'],
        ownerId: owner2.id,
        rating: 4.6,
        totalRatings: 25
      },
      {
        name: 'Sunset Football Center',
        description: 'Beautiful sunset views with modern facilities.',
        address: '654 Sunset Blvd',
        city: 'Phnom Penh',
        province: 'Phnom Penh',
        pricePerHour: 45.0,
        capacity: 10,
        fieldType: '5v5',
        surfaceType: 'artificial_turf',
        amenities: ['showers', 'parking', 'cafe'],
        images: ['https://example.com/field5.jpg'],
        ownerId: owner1.id,
        rating: 4.2,
        totalRatings: 15
      },
      {
        name: 'Elite Training Ground',
        description: 'Professional training facility with top equipment.',
        address: '987 Elite Way',
        city: 'Phnom Penh',
        province: 'Phnom Penh',
        pricePerHour: 80.0,
        capacity: 22,
        fieldType: '11v11',
        surfaceType: 'natural_grass',
        amenities: ['training_equipment', 'showers', 'gym'],
        images: ['https://example.com/field6.jpg'],
        ownerId: owner2.id,
        rating: 4.8,
        totalRatings: 42
      },
      {
        name: 'Community Sports Hub',
        description: 'Family-friendly facility with multiple fields.',
        address: '147 Community Dr',
        city: 'Battambang',
        province: 'Battambang',
        pricePerHour: 35.0,
        capacity: 12,
        fieldType: '6v6',
        surfaceType: 'artificial_turf',
        amenities: ['playground', 'parking', 'snackbar'],
        images: ['https://example.com/field7.jpg'],
        ownerId: owner1.id,
        rating: 4.1,
        totalRatings: 8
      },
      {
        name: 'Victory Stadium',
        description: 'Championship-level field with spectator seating.',
        address: '258 Victory Ave',
        city: 'Phnom Penh',
        province: 'Phnom Penh',
        pricePerHour: 90.0,
        capacity: 22,
        fieldType: '11v11',
        surfaceType: 'natural_grass',
        amenities: ['seating', 'press_box', 'vip_lounge'],
        images: ['https://example.com/field8.jpg'],
        ownerId: owner2.id,
        rating: 4.9,
        totalRatings: 56
      },
      {
        name: 'Urban Football Park',
        description: 'Modern urban facility with street football vibe.',
        address: '369 Urban St',
        city: 'Phnom Penh',
        province: 'Phnom Penh',
        pricePerHour: 40.0,
        capacity: 8,
        fieldType: '4v4',
        surfaceType: 'artificial_turf',
        amenities: ['music_system', 'lights', 'street_food'],
        images: ['https://example.com/field9.jpg'],
        ownerId: owner1.id,
        rating: 4.0,
        totalRatings: 6
      },
      {
        name: 'Lakeside Football Field',
        description: 'Scenic lakeside location with peaceful environment.',
        address: '741 Lakeside Rd',
        city: 'Siem Reap',
        province: 'Siem Reap',
        pricePerHour: 50.0,
        capacity: 14,
        fieldType: '7v7',
        surfaceType: 'natural_grass',
        amenities: ['lake_view', 'parking', 'picnic_area'],
        images: ['https://example.com/field10.jpg'],
        ownerId: owner2.id,
        rating: 4.4,
        totalRatings: 22
      }
    ]);

    // Create 10 Teams
    const teams = await Team.bulkCreate([
      {
        name: 'Downtown FC',
        description: 'Friendly team playing weekly games.',
        captainId: captain1.id,
        skillLevel: 'intermediate',
        maxPlayers: 15,
        homeFieldId: fields[0].id,
        isActive: true
      },
      {
        name: 'Night Owls United',
        description: 'Evening matches and competitive spirit.',
        captainId: captain2.id,
        skillLevel: 'advanced',
        maxPlayers: 18,
        homeFieldId: fields[1].id,
        isActive: true
      },
      {
        name: 'Sunset Strikers',
        description: 'Passionate players who love sunset games.',
        captainId: captain3.id,
        skillLevel: 'intermediate',
        maxPlayers: 16,
        homeFieldId: fields[4].id,
>>>>>>> 216e95ab760603d823dc55e40c1816704278c505
        isActive: true
      },
      {
        name: 'Elite Warriors',
        description: 'Competitive team aiming for championships.',
        captainId: captain1.id,
        skillLevel: 'advanced',
        maxPlayers: 20,
        homeFieldId: fields[5].id,
        isActive: true
      },
      {
        name: 'Community Champions',
        description: 'Local team with strong community ties.',
        captainId: captain2.id,
        skillLevel: 'beginner',
        maxPlayers: 12,
        homeFieldId: fields[6].id,
        isActive: true
      },
      {
        name: 'Victory Legends',
        description: 'Experienced players with winning mentality.',
        captainId: captain3.id,
        skillLevel: 'advanced',
        maxPlayers: 18,
        homeFieldId: fields[7].id,
        isActive: true
      },
      {
        name: 'Urban Ballers',
        description: 'Street football enthusiasts with style.',
        captainId: captain1.id,
        skillLevel: 'intermediate',
        maxPlayers: 10,
        homeFieldId: fields[8].id,
        isActive: true
      },
      {
        name: 'Lakeside FC',
        description: 'Scenic location, peaceful playing environment.',
        captainId: captain2.id,
        skillLevel: 'beginner',
        maxPlayers: 14,
        homeFieldId: fields[9].id,
        isActive: true
      },
      {
        name: 'Riverside Rangers',
        description: 'Team that loves riverside matches.',
        captainId: captain3.id,
        skillLevel: 'intermediate',
        maxPlayers: 16,
        homeFieldId: fields[1].id,
        isActive: true
      },
      {
        name: 'Golden Eagles',
        description: 'Soaring high with golden performances.',
        captainId: captain1.id,
        skillLevel: 'advanced',
        maxPlayers: 20,
        homeFieldId: fields[3].id,
=======
        status: 'active',
        isActive: true
      },
      {
        teamId: team1.id,
        userId: player2.id,
        role: 'player',
        status: 'pending',
>>>>>>> c85dc3b141aa419b615abd61c2b72a31a204f06d
        isActive: true
      }
    ]);

    // Create Sample Bookings for Popular Time Slots
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Helper function to create booking date
    const createBookingDate = (date, time) => {
      const [hours, minutes] = time.split(':');
      const bookingDate = new Date(date);
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return bookingDate;
    };

    // Sample bookings with realistic distribution
    const sampleBookings = [
      // Evening Prime Time (18:00-20:00) - Most popular
      {
        fieldId: field1.id,
        teamId: team1.id,
        startTime: createBookingDate(today, '18:00'),
        endTime: createBookingDate(today, '20:00'),
        status: 'confirmed',
        totalPrice: 100.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      {
        fieldId: field2.id,
        teamId: team2.id,
        startTime: createBookingDate(tomorrow, '18:00'),
        endTime: createBookingDate(tomorrow, '20:00'),
        status: 'confirmed',
        totalPrice: 140.00,
        createdBy: captain2.id,
        isMatchmaking: false
      },
      {
        fieldId: field1.id,
        teamId: team2.id,
        startTime: createBookingDate(today, '19:00'),
        endTime: createBookingDate(today, '21:00'),
        status: 'confirmed',
        totalPrice: 100.00,
        createdBy: captain2.id,
        isMatchmaking: false
      },
      
      // Morning Session (08:00-10:00) - Moderate popularity
      {
        fieldId: field2.id,
        teamId: team1.id,
        startTime: createBookingDate(today, '08:00'),
        endTime: createBookingDate(today, '10:00'),
        status: 'confirmed',
        totalPrice: 140.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      {
        fieldId: field1.id,
        teamId: team1.id,
        startTime: createBookingDate(tomorrow, '09:00'),
        endTime: createBookingDate(tomorrow, '11:00'),
        status: 'confirmed',
        totalPrice: 100.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      
      // Lunch Break (12:00-14:00) - Good popularity
      {
        fieldId: field1.id,
        teamId: team2.id,
        startTime: createBookingDate(today, '12:00'),
        endTime: createBookingDate(today, '14:00'),
        status: 'confirmed',
        totalPrice: 100.00,
        createdBy: captain2.id,
        isMatchmaking: false
      },
      {
        fieldId: field2.id,
        teamId: team1.id,
        startTime: createBookingDate(tomorrow, '13:00'),
        endTime: createBookingDate(tomorrow, '15:00'),
        status: 'confirmed',
        totalPrice: 140.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      
      // Afternoon sessions - Various times
      {
        fieldId: field1.id,
        teamId: team1.id,
        startTime: createBookingDate(today, '15:00'),
        endTime: createBookingDate(today, '17:00'),
        status: 'confirmed',
        totalPrice: 100.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      {
        fieldId: field2.id,
        teamId: team2.id,
        startTime: createBookingDate(today, '16:00'),
        endTime: createBookingDate(today, '18:00'),
        status: 'confirmed',
        totalPrice: 140.00,
        createdBy: captain2.id,
        isMatchmaking: false
      },
      
      // Night Session (20:00-22:00) - Less popular
      {
        fieldId: field2.id,
        teamId: team1.id,
        startTime: createBookingDate(today, '20:00'),
        endTime: createBookingDate(today, '22:00'),
        status: 'confirmed',
        totalPrice: 140.00,
        createdBy: captain1.id,
        isMatchmaking: false
      },
      
      // Some pending bookings for realistic data
      {
        fieldId: field1.id,
        teamId: team2.id,
        startTime: createBookingDate(tomorrow, '17:00'),
        endTime: createBookingDate(tomorrow, '19:00'),
        status: 'pending',
        totalPrice: 100.00,
        createdBy: captain2.id,
        isMatchmaking: false
      },
      {
        fieldId: field2.id,
        teamId: team1.id,
        startTime: createBookingDate(tomorrow, '10:00'),
        endTime: createBookingDate(tomorrow, '12:00'),
        status: 'pending',
        totalPrice: 140.00,
        createdBy: captain1.id,
        isMatchmaking: false
      }
    ];

    await Booking.bulkCreate(sampleBookings);

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

