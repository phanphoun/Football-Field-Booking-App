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

    // Create 2 Field Owners
    const owner1 = await User.create({
      username: 'owner1',
      email: 'owner1@example.com',
      password: hashedPassword,
      firstName: 'Field',
      lastName: 'Owner1',
      role: 'field_owner'
    });

    const owner2 = await User.create({
      username: 'owner2',
      email: 'owner2@example.com',
      password: hashedPassword,
      firstName: 'Field',
      lastName: 'Owner2',
      role: 'field_owner'
    });

    // Create 3 Captains
    const captain1 = await User.create({
      username: 'captain1',
      email: 'captain1@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Captain1',
      role: 'captain'
    });

    const captain2 = await User.create({
      username: 'captain2',
      email: 'captain2@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Captain2',
      role: 'captain'
    });

    const captain3 = await User.create({
      username: 'captain3',
      email: 'captain3@example.com',
      password: hashedPassword,
      firstName: 'Team',
      lastName: 'Captain3',
      role: 'captain'
    });

    // Create 4 Players
    const player1 = await User.create({
      username: 'player1',
      email: 'player1@example.com',
      password: hashedPassword,
      firstName: 'Player',
      lastName: 'One',
      role: 'player'
    });

    const player2 = await User.create({
      username: 'player2',
      email: 'player2@example.com',
      password: hashedPassword,
      firstName: 'Player',
      lastName: 'Two',
      role: 'player'
    });

    const player3 = await User.create({
      username: 'player3',
      email: 'player3@example.com',
      password: hashedPassword,
      firstName: 'Player',
      lastName: 'Three',
      role: 'player'
    });

    const player4 = await User.create({
      username: 'player4',
      email: 'player4@example.com',
      password: hashedPassword,
      firstName: 'Player',
      lastName: 'Four',
      role: 'player'
    });

<<<<<<< HEAD
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

    // Team memberships (accepted + pending request demo)
    await TeamMember.bulkCreate([
      {
        teamId: team1.id,
        userId: captain1.id,
        role: 'captain',
        status: 'accepted',
        isActive: true
      },
      {
        teamId: team2.id,
        userId: captain2.id,
        role: 'captain',
        status: 'accepted',
        isActive: true
      },
      {
        teamId: team1.id,
        userId: player1.id,
        role: 'player',
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
        isActive: true
      }
    ]);

    // Team memberships with 15+ records
    await TeamMember.bulkCreate([
      // Captains in their teams
      { teamId: teams[0].id, userId: captain1.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[1].id, userId: captain2.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[2].id, userId: captain3.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[3].id, userId: captain1.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[4].id, userId: captain2.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[5].id, userId: captain3.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[6].id, userId: captain1.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[7].id, userId: captain2.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[8].id, userId: captain3.id, role: 'captain', status: 'active', isActive: true },
      { teamId: teams[9].id, userId: captain1.id, role: 'captain', status: 'active', isActive: true },
      
      // Players in teams
      { teamId: teams[0].id, userId: player1.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[0].id, userId: player2.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[1].id, userId: player3.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[2].id, userId: player4.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[3].id, userId: player1.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[4].id, userId: player2.id, role: 'player', status: 'pending', isActive: true },
      { teamId: teams[5].id, userId: player3.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[6].id, userId: player4.id, role: 'player', status: 'active', isActive: true },
      { teamId: teams[7].id, userId: player1.id, role: 'player', status: 'pending', isActive: true },
      { teamId: teams[8].id, userId: player2.id, role: 'player', status: 'active', isActive: true }
    ]);

    // Create 20+ Sample Bookings for comprehensive data
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    // Helper function to create booking date
    const createBookingDate = (date, time) => {
      const [hours, minutes] = time.split(':');
      const bookingDate = new Date(date);
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return bookingDate;
    };

    // 25 Sample bookings with realistic distribution
    const sampleBookings = [
      // Evening Prime Time (18:00-20:00) - Most popular
      { fieldId: fields[0].id, teamId: teams[0].id, startTime: createBookingDate(today, '18:00'), endTime: createBookingDate(today, '20:00'), status: 'confirmed', totalPrice: 100.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[1].id, teamId: teams[1].id, startTime: createBookingDate(tomorrow, '18:00'), endTime: createBookingDate(tomorrow, '20:00'), status: 'confirmed', totalPrice: 140.00, createdBy: captain2.id, isMatchmaking: false },
      { fieldId: fields[2].id, teamId: teams[2].id, startTime: createBookingDate(today, '19:00'), endTime: createBookingDate(today, '21:00'), status: 'confirmed', totalPrice: 120.00, createdBy: captain3.id, isMatchmaking: false },
      { fieldId: fields[3].id, teamId: teams[3].id, startTime: createBookingDate(dayAfter, '18:00'), endTime: createBookingDate(dayAfter, '20:00'), status: 'confirmed', totalPrice: 110.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[4].id, teamId: teams[4].id, startTime: createBookingDate(today, '18:00'), endTime: createBookingDate(today, '20:00'), status: 'confirmed', totalPrice: 90.00, createdBy: captain2.id, isMatchmaking: false },
      
      // Morning Session (08:00-10:00) - Moderate popularity
      { fieldId: fields[5].id, teamId: teams[5].id, startTime: createBookingDate(today, '08:00'), endTime: createBookingDate(today, '10:00'), status: 'confirmed', totalPrice: 160.00, createdBy: captain3.id, isMatchmaking: false },
      { fieldId: fields[6].id, teamId: teams[6].id, startTime: createBookingDate(tomorrow, '09:00'), endTime: createBookingDate(tomorrow, '11:00'), status: 'confirmed', totalPrice: 70.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[7].id, teamId: teams[7].id, startTime: createBookingDate(dayAfter, '08:00'), endTime: createBookingDate(dayAfter, '10:00'), status: 'confirmed', totalPrice: 180.00, createdBy: captain2.id, isMatchmaking: false },
      { fieldId: fields[8].id, teamId: teams[8].id, startTime: createBookingDate(today, '10:00'), endTime: createBookingDate(today, '12:00'), status: 'confirmed', totalPrice: 80.00, createdBy: captain3.id, isMatchmaking: false },
      
      // Lunch Break (12:00-14:00) - Good popularity
      { fieldId: fields[9].id, teamId: teams[9].id, startTime: createBookingDate(today, '12:00'), endTime: createBookingDate(today, '14:00'), status: 'confirmed', totalPrice: 100.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[0].id, teamId: teams[0].id, startTime: createBookingDate(tomorrow, '13:00'), endTime: createBookingDate(tomorrow, '15:00'), status: 'confirmed', totalPrice: 100.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[1].id, teamId: teams[1].id, startTime: createBookingDate(dayAfter, '12:00'), endTime: createBookingDate(dayAfter, '14:00'), status: 'confirmed', totalPrice: 140.00, createdBy: captain2.id, isMatchmaking: false },
      
      // Afternoon sessions
      { fieldId: fields[2].id, teamId: teams[2].id, startTime: createBookingDate(today, '15:00'), endTime: createBookingDate(today, '17:00'), status: 'confirmed', totalPrice: 120.00, createdBy: captain3.id, isMatchmaking: false },
      { fieldId: fields[3].id, teamId: teams[3].id, startTime: createBookingDate(tomorrow, '16:00'), endTime: createBookingDate(tomorrow, '18:00'), status: 'confirmed', totalPrice: 110.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[4].id, teamId: teams[4].id, startTime: createBookingDate(dayAfter, '14:00'), endTime: createBookingDate(dayAfter, '16:00'), status: 'confirmed', totalPrice: 90.00, createdBy: captain2.id, isMatchmaking: false },
      { fieldId: fields[5].id, teamId: teams[5].id, startTime: createBookingDate(today, '17:00'), endTime: createBookingDate(today, '19:00'), status: 'confirmed', totalPrice: 160.00, createdBy: captain3.id, isMatchmaking: false },
      
      // Night Session (20:00-22:00) - Less popular
      { fieldId: fields[6].id, teamId: teams[6].id, startTime: createBookingDate(today, '20:00'), endTime: createBookingDate(today, '22:00'), status: 'confirmed', totalPrice: 70.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[7].id, teamId: teams[7].id, startTime: createBookingDate(tomorrow, '21:00'), endTime: createBookingDate(tomorrow, '23:00'), status: 'confirmed', totalPrice: 180.00, createdBy: captain2.id, isMatchmaking: false },
      
      // Various other times
      { fieldId: fields[8].id, teamId: teams[8].id, startTime: createBookingDate(today, '11:00'), endTime: createBookingDate(today, '13:00'), status: 'confirmed', totalPrice: 80.00, createdBy: captain3.id, isMatchmaking: false },
      { fieldId: fields[9].id, teamId: teams[9].id, startTime: createBookingDate(tomorrow, '14:00'), endTime: createBookingDate(tomorrow, '16:00'), status: 'confirmed', totalPrice: 100.00, createdBy: captain1.id, isMatchmaking: false },
      { fieldId: fields[0].id, teamId: teams[0].id, startTime: createBookingDate(dayAfter, '16:00'), endTime: createBookingDate(dayAfter, '18:00'), status: 'confirmed', totalPrice: 100.00, createdBy: captain1.id, isMatchmaking: false },
      
      // Pending bookings for realistic data
      { fieldId: fields[1].id, teamId: teams[1].id, startTime: createBookingDate(tomorrow, '17:00'), endTime: createBookingDate(tomorrow, '19:00'), status: 'pending', totalPrice: 140.00, createdBy: captain2.id, isMatchmaking: false },
      { fieldId: fields[2].id, teamId: teams[2].id, startTime: createBookingDate(dayAfter, '10:00'), endTime: createBookingDate(dayAfter, '12:00'), status: 'pending', totalPrice: 120.00, createdBy: captain3.id, isMatchmaking: false },
      { fieldId: fields[3].id, teamId: teams[3].id, startTime: createBookingDate(today, '13:00'), endTime: createBookingDate(today, '15:00'), status: 'pending', totalPrice: 110.00, createdBy: captain1.id, isMatchmaking: false }
    ];

    await Booking.bulkCreate(sampleBookings);

    console.log('Database seeded successfully.');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('===================');
    console.log('👤 Admin User:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Password123');
    console.log('\n🏢 Field Owners:');
    console.log('   Email: owner1@example.com');
    console.log('   Password: Password123');
    console.log('   Email: owner2@example.com');
    console.log('   Password: Password123');
    console.log('\n🎽 Captains:');
    console.log('   Email: captain1@example.com');
    console.log('   Password: Password123');
    console.log('   Email: captain2@example.com');
    console.log('   Password: Password123');
    console.log('   Email: captain3@example.com');
    console.log('   Password: Password123');
    console.log('\n⚽ Players:');
    console.log('   Email: player1@example.com');
    console.log('   Password: Password123');
    console.log('   Email: player2@example.com');
    console.log('   Password: Password123');
    console.log('   Email: player3@example.com');
    console.log('   Password: Password123');
    console.log('   Email: player4@example.com');
    console.log('   Password: Password123');

    console.log('\n� DATABASE SUMMARY:');
    console.log('===================');
    console.log(`👥 Users: 10 (1 Admin, 2 Field Owners, 3 Captains, 4 Players)`);
    console.log(`🏟️  Fields: 10 (Various types and locations)`);
    console.log(`🏆 Teams: 10 (Different skill levels and home fields)`);
    console.log(`📋 Team Members: 20 (Active and pending memberships)`);
    console.log(`📅 Bookings: 25 (22 Confirmed, 3 Pending)`);
    console.log('\n🎯 POPULAR TIME SLOTS DATA:');
    console.log(`   Evening (18:00-20:00): 5 bookings - MOST POPULAR`);
    console.log(`   Morning (08:00-10:00): 4 bookings - HIGH DEMAND`);
    console.log(`   Lunch (12:00-14:00): 3 bookings - MODERATE`);
    console.log(`   Afternoon: 6 bookings - VARIED`);
    console.log(`   Night (20:00+): 2 bookings - LOW DEMAND`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

