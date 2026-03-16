const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Field,
  Team,
  TeamMember,
  Booking,
  BookingJoinRequest,
  MatchResult,
  Notification,
  Rating,
  RoleRequest
} = require('../models');

const PASSWORD = 'Password123';
const DEFAULT_AVATAR = '/uploads/profile/default_profile.jpg';
const DEFAULT_FIELD_IMAGE = '/hero-manu.jpg';

const FIELD_NAMES = [
  'Victory Arena',
  'Skyline Turf',
  'Mekong Stadium',
  'Golden Boots Center',
  'Capital Football Hub',
  'Night Lights Field',
  'River Park Pitch',
  'Weekend Sports Ground',
  'Phoenix Arena',
  'Lion City Turf',
  'United Sports Base',
  'Prime Match Field',
  'Goal Factory',
  'Champions Yard',
  'Royal Kickoff Park'
];

const TEAM_NAMES = [
  'Mekong United',
  'City Warriors',
  'Golden Boots',
  'Night Strikers',
  'Royal Tigers',
  'Skyline FC',
  'Victory Eleven',
  'Capital Rangers',
  'Phoenix Squad',
  'Weekend Stars',
  'River Eagles',
  'Lion Hearts',
  'Thunder Club',
  'Prime Shooters',
  'Legend XI'
];

const firstNames = [
  'Admin',
  'Dara',
  'Nita',
  'Sokha',
  'Vanna',
  'Malis',
  'Rin',
  'Piseth',
  'Dalin',
  'Sreyna',
  'Kanha',
  'Ratha',
  'Narin',
  'Sophy',
  'Ravy'
];

const lastNames = [
  'Manager',
  'Owner',
  'Owner',
  'Owner',
  'Captain',
  'Captain',
  'Captain',
  'Captain',
  'Captain',
  'Player',
  'Player',
  'Player',
  'Player',
  'Player',
  'Player'
];

const roles = [
  'admin',
  'field_owner',
  'field_owner',
  'field_owner',
  'captain',
  'captain',
  'captain',
  'captain',
  'captain',
  'player',
  'player',
  'player',
  'player',
  'player',
  'player'
];

const statuses = [
  'active',
  'active',
  'active',
  'active',
  'active',
  'active',
  'active',
  'inactive',
  'active',
  'active',
  'active',
  'active',
  'suspended',
  'active',
  'active'
];

const genders = ['male', 'female', 'male', 'female', 'male', 'female', 'male', 'male', 'female', 'female', 'male', 'male', 'female', 'female', 'male'];
const skillLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
const fieldTypes = ['5v5', '7v7', '11v11', 'futsal'];
const surfaceTypes = ['artificial_turf', 'natural_grass', 'concrete', 'indoor'];
const fieldStatuses = ['available', 'available', 'available', 'available', 'maintenance', 'unavailable'];
const provinces = ['Phnom Penh', 'Kandal', 'Siem Reap', 'Battambang', 'Kampot'];
const amenitiesPool = [
  ['parking', 'showers', 'lights'],
  ['parking', 'water', 'seating'],
  ['wifi', 'changing room', 'lights'],
  ['parking', 'coffee', 'seating'],
  ['water', 'showers', 'locker room']
];

const dayOffsets = [-18, -16, -14, -12, -10, -8, -6, -4, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const createDate = (dayOffset, hour, durationHours = 2) => {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);
  return { start, end };
};

const operatingHours = {
  monday: { open: '08:00', close: '22:00' },
  tuesday: { open: '08:00', close: '22:00' },
  wednesday: { open: '08:00', close: '22:00' },
  thursday: { open: '08:00', close: '22:00' },
  friday: { open: '08:00', close: '22:00' },
  saturday: { open: '08:00', close: '22:00' },
  sunday: { open: '08:00', close: '22:00' }
};

const seedDatabase = async () => {
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const hashedPassword = await bcrypt.hash(PASSWORD, 12);

    const users = [];
    for (let index = 0; index < 15; index += 1) {
      const user = await User.create({
        username: `${roles[index]}${index + 1}`,
        email: `${roles[index]}${index + 1}@example.com`,
        password: hashedPassword,
        firstName: firstNames[index],
        lastName: lastNames[index],
        phone: `01234${String(index + 1).padStart(4, '0')}`,
        role: roles[index],
        status: statuses[index],
        avatarUrl: DEFAULT_AVATAR,
        dateOfBirth: `199${index % 10}-0${(index % 8) + 1}-1${index % 9}`,
        gender: genders[index],
        address: `Street ${index + 10}, ${provinces[index % provinces.length]}, Cambodia`,
        emailVerified: true,
        lastLogin: new Date(Date.now() - index * 86400000)
      });
      users.push(user);
    }

    const admin = users[0];
    const owners = users.slice(1, 4);
    const captains = users.slice(4, 9);
    const players = users.slice(9);

    const fields = [];
    for (let index = 0; index < 15; index += 1) {
      const owner = owners[index % owners.length];
      const field = await Field.create({
        name: FIELD_NAMES[index],
        description: `${FIELD_NAMES[index]} is a demo venue with strong traffic for booking, team, owner, and match features.`,
        address: `Street ${120 + index}, ${provinces[index % provinces.length]}`,
        city: provinces[index % provinces.length],
        province: provinces[(index + 1) % provinces.length],
        latitude: 11.55 + index * 0.01,
        longitude: 104.88 + index * 0.01,
        ownerId: owner.id,
        pricePerHour: 35 + index * 3,
        operatingHours,
        fieldType: fieldTypes[index % fieldTypes.length],
        surfaceType: surfaceTypes[index % surfaceTypes.length],
        capacity: 10 + (index % 8) * 2,
        status: fieldStatuses[index % fieldStatuses.length],
        amenities: amenitiesPool[index % amenitiesPool.length],
        images: [DEFAULT_FIELD_IMAGE],
        rating: (3.5 + (index % 5) * 0.3).toFixed(2),
        totalRatings: 8 + index
      });
      fields.push(field);
    }

    const teams = [];
    for (let index = 0; index < 15; index += 1) {
      const captain = captains[index % captains.length];
      const team = await Team.create({
        name: TEAM_NAMES[index],
        description: `${TEAM_NAMES[index]} is sample team ${index + 1} used to display team, booking, and match features.`,
        captainId: captain.id,
        maxPlayers: 11 + (index % 5),
        skillLevel: skillLevels[index % skillLevels.length],
        homeFieldId: fields[index % fields.length].id,
        logoUrl: null,
        isActive: index % 6 !== 0
      });
      teams.push(team);
    }

<<<<<<< HEAD
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
=======
    const teamMembers = [];
    for (let index = 0; index < teams.length; index += 1) {
      teamMembers.push({
        teamId: teams[index].id,
        userId: teams[index].captainId,
>>>>>>> 86ef1e72ecc2a9947dba37d3a2a402e3e34f34e5
        role: 'captain',
        status: 'active',
        joinedAt: new Date(Date.now() - (index + 3) * 86400000),
        isActive: true
<<<<<<< HEAD
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
=======
      });
    }

    for (let index = 0; index < 15; index += 1) {
      const player = players[index % players.length];
      teamMembers.push({
        teamId: teams[index].id,
        userId: player.id,
        role: index % 4 === 0 ? 'substitute' : 'player',
        status: index % 5 === 0 ? 'pending' : 'active',
        joinedAt: index % 5 === 0 ? null : new Date(Date.now() - (index + 1) * 43200000),
        isActive: index % 7 !== 0
      });
    }

    await TeamMember.bulkCreate(teamMembers);

    const bookings = [];
    const completedBookingIndexes = [];

    for (let index = 0; index < 30; index += 1) {
      const team = teams[index % teams.length];
      const field = fields[index % fields.length];
      const opponentTeam = index < 15 ? teams[(index + 5) % teams.length] : null;
      const { start, end } = createDate(dayOffsets[index % dayOffsets.length], 8 + (index % 8), index % 3 === 0 ? 1 : 2);

      let status = 'pending';
      if (index < 15) {
        status = 'completed';
        completedBookingIndexes.push(index);
      } else if (index < 21) {
        status = 'confirmed';
      } else if (index < 25) {
        status = 'pending';
      } else {
        status = 'cancelled';
>>>>>>> 86ef1e72ecc2a9947dba37d3a2a402e3e34f34e5
      }

      bookings.push({
        fieldId: field.id,
        teamId: team.id,
        opponentTeamId: opponentTeam ? opponentTeam.id : null,
        startTime: start,
        endTime: end,
        status,
        totalPrice: Number(field.pricePerHour) * ((end - start) / 3600000),
        specialRequests: index % 4 === 0 ? 'Need extra bibs and water.' : null,
        createdBy: team.captainId,
        isMatchmaking: index >= 21 && index < 26,
        notes: `Demo booking ${index + 1}`
      });
    }

    const createdBookings = await Booking.bulkCreate(bookings);

    const matchResults = [];
    for (let index = 0; index < 15; index += 1) {
      const booking = createdBookings[index];
      const homeTeam = teams[index % teams.length];
      const awayTeam = teams[(index + 5) % teams.length];
      const mvp = players[index % players.length];
      matchResults.push({
        bookingId: booking.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: (index + 2) % 6,
        awayScore: (index + 1) % 5,
        matchStatus: 'completed',
        mvpPlayerId: mvp.id,
        matchNotes: `Completed demo match ${index + 1}`,
        recordedAt: new Date(),
        recordedBy: owners[index % owners.length].id,
        matchEvents: [
          { minute: 12, type: 'goal', teamId: homeTeam.id },
          { minute: 39, type: 'goal', teamId: awayTeam.id }
        ]
      });
    }
    await MatchResult.bulkCreate(matchResults);

    const bookingJoinRequests = [];
    for (let index = 0; index < 15; index += 1) {
      const booking = createdBookings[21 + (index % 4)];
      const requesterTeam = teams[(index + 8) % teams.length];
      const requesterCaptain = captains[(index + 1) % captains.length];
      const status = index % 5 === 0 ? 'accepted' : index % 3 === 0 ? 'rejected' : 'pending';

      bookingJoinRequests.push({
        bookingId: booking.id,
        requesterTeamId: requesterTeam.id,
        requesterCaptainId: requesterCaptain.id,
        message: `Demo join request ${index + 1} from ${requesterTeam.name}`,
        status,
        respondedAt: status === 'pending' ? null : new Date(),
        respondedBy: status === 'pending' ? null : booking.createdBy
      });
    }
    await BookingJoinRequest.bulkCreate(bookingJoinRequests);

    const ratings = [];
    for (let index = 0; index < 15; index += 1) {
      const booking = createdBookings[index];
      const raterTeam = teams[index % teams.length];
      const ratedTeam = teams[(index + 5) % teams.length];
      ratings.push({
        teamIdRater: raterTeam.id,
        teamIdRated: ratedTeam.id,
        bookingId: booking.id,
        rating: (index % 5) + 1,
        review: `Sample review ${index + 1} for ${ratedTeam.name}.`,
        sportsmanshipScore: ((index + 2) % 5) + 1,
        ratingType: 'overall',
        isRecommended: index % 2 === 0
      });
    }
    await Rating.bulkCreate(ratings);

    const roleRequests = [];
    const roleRequestUsers = [...players, ...captains, ...owners, admin].slice(0, 15);
    for (let index = 0; index < 15; index += 1) {
      const status = index % 4 === 0 ? 'approved' : index % 4 === 1 ? 'rejected' : 'pending';
      roleRequests.push({
        requesterId: roleRequestUsers[index].id,
        requestedRole: index % 2 === 0 ? 'captain' : 'field_owner',
        status,
        note: `Role request demo ${index + 1}`,
        reviewedBy: status === 'pending' ? null : admin.id,
        reviewedAt: status === 'pending' ? null : new Date(Date.now() - index * 3600000)
      });
    }
    await RoleRequest.bulkCreate(roleRequests);

    const notifications = [];
    const notificationUsers = [...users];
    for (let index = 0; index < 15; index += 1) {
      const recipient = notificationUsers[index % notificationUsers.length];
      const type = index % 5 === 0 ? 'team_invite' : index % 5 === 1 ? 'booking' : index % 5 === 2 ? 'field_update' : index % 5 === 3 ? 'match_result' : 'system';
      notifications.push({
        userId: recipient.id,
        title: `Demo notification ${index + 1}`,
        message: `This is sample notification ${index + 1} for ${recipient.username}.`,
        type,
        isRead: index % 4 === 0,
        readAt: index % 4 === 0 ? new Date() : null,
        metadata: {
          event: `demo_event_${index + 1}`,
          bookingId: createdBookings[index % createdBookings.length].id,
          teamId: teams[index % teams.length].id,
          fieldId: fields[index % fields.length].id
        }
      });
    }
    await Notification.bulkCreate(notifications);

    const counts = {
      users: await User.count(),
      fields: await Field.count(),
      teams: await Team.count(),
      teamMembers: await TeamMember.count(),
      bookings: await Booking.count(),
      bookingJoinRequests: await BookingJoinRequest.count(),
      matchResults: await MatchResult.count(),
      notifications: await Notification.count(),
      ratings: await Rating.count(),
      roleRequests: await RoleRequest.count()
    };

    console.log('Database seeded successfully with demo data.');
    console.log('\nSample login accounts');
    console.log('Admin: admin1@example.com / Password123');
    console.log('Field owner: field_owner2@example.com / Password123');
    console.log('Captain: captain5@example.com / Password123');
    console.log('Player: player10@example.com / Password123');
    console.log('\nInserted record counts');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
