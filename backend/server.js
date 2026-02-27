const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { sequelize, User, Field, Booking, Team, TeamMember, MatchResult, Notification, Rating } = require('./src/models');
const authController = require('./src/controllers/authController');
const auth = require('./src/middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ============= API ROUTES =============

// Authentication Routes (Public)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Protected Routes (Require Authentication)
app.use('/api', auth);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Football Field Booking API is running!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile'
      },
      users: '/api/users',
      fields: '/api/fields',
      bookings: '/api/bookings',
      teams: '/api/teams',
      matchResults: '/api/match-results',
      notifications: '/api/notifications',
      ratings: '/api/ratings'
    }
  });
});

// ============= USERS API =============
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await User.findAll({
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'bookings' },
      { model: Team, as: 'teams', through: { attributes: [] } },
      { model: Notification, as: 'notifications' }
    ]
  });
  res.json({ success: true, data: users });
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'bookings' },
      { model: Team, as: 'teams', through: { attributes: [] } },
      { model: Notification, as: 'notifications' }
    ]
  });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
}));

app.get('/api/auth/profile', authController.getProfile);
app.put('/api/auth/profile', authController.updateProfile);

// ============= FIELDS API =============
app.get('/api/fields', asyncHandler(async (req, res) => {
  const fields = await Field.findAll({
    include: [
      { model: User, as: 'owner', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: Booking, as: 'bookings' }
    ]
  });
  res.json({ success: true, data: fields });
}));

app.get('/api/fields/:id', asyncHandler(async (req, res) => {
  const field = await Field.findByPk(req.params.id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: Booking, as: 'bookings' }
    ]
  });
  if (!field) {
    return res.status(404).json({ success: false, message: 'Field not found' });
  }
  res.json({ success: true, data: field });
}));

app.post('/api/fields', asyncHandler(async (req, res) => {
  const field = await Field.create({
    ...req.body,
    ownerId: req.user.id
  });
  res.status(201).json({ success: true, data: field });
}));

// ============= BOOKINGS API =============
app.get('/api/bookings', asyncHandler(async (req, res) => {
  const { status, fieldId, teamId } = req.query;
  const whereClause = {};
  
  if (status) whereClause.status = status;
  if (fieldId) whereClause.fieldId = fieldId;
  if (teamId) whereClause.teamId = teamId;

  const bookings = await Booking.findAll({
    where: whereClause,
    include: [
      { model: Field, as: 'field' },
      { model: Team, as: 'team' },
      { model: Team, as: 'opponentTeam' },
      { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ],
    order: [['startTime', 'ASC']]
  });
  res.json({ success: true, data: bookings });
}));

app.get('/api/bookings/:id', asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [
      { model: Field, as: 'field' },
      { model: Team, as: 'team' },
      { model: Team, as: 'opponentTeam' },
      { model: User, as: 'creator', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.json({ success: true, data: booking });
}));

app.post('/api/bookings', asyncHandler(async (req, res) => {
  const booking = await Booking.create({
    ...req.body,
    userId: req.user.id,
    creatorId: req.user.id
  });
  res.status(201).json({ success: true, data: booking });
}));

// ============= TEAMS API =============
app.get('/api/teams', asyncHandler(async (req, res) => {
  const teams = await Team.findAll({
    include: [
      { model: User, as: 'captain', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'players', through: { attributes: ['role', 'status', 'joinedAt', 'isActive'] } },
      { model: Booking, as: 'bookings' },
      { model: Booking, as: 'opponentBookings' }
    ]
  });
  res.json({ success: true, data: teams });
}));

app.get('/api/teams/:id', asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, {
    include: [
      { model: User, as: 'captain', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'players', through: { attributes: ['role', 'status', 'joinedAt', 'isActive'] } },
      { model: Booking, as: 'bookings' },
      { model: Booking, as: 'opponentBookings' }
    ]
  });
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }
  res.json({ success: true, data: team });
}));

app.post('/api/teams', asyncHandler(async (req, res) => {
  const team = await Team.create({
    ...req.body,
    captainId: req.user.id
  });
  res.status(201).json({ success: true, data: team });
}));

// ============= TEAM MEMBERS API =============
app.get('/api/team-members', asyncHandler(async (req, res) => {
  const { teamId, userId } = req.query;
  const whereClause = {};
  
  if (teamId) whereClause.teamId = teamId;
  if (userId) whereClause.userId = userId;

  const teamMembers = await TeamMember.findAll({
    where: whereClause,
    include: [
      { model: Team, as: 'team' },
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  res.json({ success: true, data: teamMembers });
}));

app.post('/api/team-members', asyncHandler(async (req, res) => {
  const teamMember = await TeamMember.create(req.body);
  res.status(201).json({ success: true, data: teamMember });
}));

// ============= MATCH RESULTS API =============
app.get('/api/match-results', asyncHandler(async (req, res) => {
  const { matchStatus, homeTeamId, awayTeamId } = req.query;
  const whereClause = {};
  
  if (matchStatus) whereClause.matchStatus = matchStatus;
  if (homeTeamId) whereClause.homeTeamId = homeTeamId;
  if (awayTeamId) whereClause.awayTeamId = awayTeamId;

  const matchResults = await MatchResult.findAll({
    where: whereClause,
    include: [
      { model: Booking, as: 'booking' },
      { model: Team, as: 'homeTeam' },
      { model: Team, as: 'awayTeam' },
      { model: User, as: 'mvpPlayer', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'recorder', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ],
    order: [['recordedAt', 'DESC']]
  });
  res.json({ success: true, data: matchResults });
}));

app.get('/api/match-results/:id', asyncHandler(async (req, res) => {
  const matchResult = await MatchResult.findByPk(req.params.id, {
    include: [
      { model: Booking, as: 'booking' },
      { model: Team, as: 'homeTeam' },
      { model: Team, as: 'awayTeam' },
      { model: User, as: 'mvpPlayer', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'recorder', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  if (!matchResult) {
    return res.status(404).json({ success: false, message: 'Match result not found' });
  }
  res.json({ success: true, data: matchResult });
}));

app.post('/api/match-results', asyncHandler(async (req, res) => {
  const matchResult = await MatchResult.create({
    ...req.body,
    recordedBy: req.user.id
  });
  res.status(201).json({ success: true, data: matchResult });
}));

// ============= NOTIFICATIONS API =============
app.get('/api/notifications', asyncHandler(async (req, res) => {
  const { userId, isRead, type } = req.query;
  const whereClause = {};
  
  if (userId) whereClause.userId = userId;
  if (isRead !== undefined) whereClause.isRead = isRead === 'true';
  if (type) whereClause.type = type;

  const notifications = await Notification.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: notifications });
}));

app.get('/api/notifications/:id', asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, data: notification });
}));

app.post('/api/notifications', asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json({ success: true, data: notification });
}));

// ============= RATINGS API =============
app.get('/api/ratings', asyncHandler(async (req, res) => {
  const { teamIdRated, teamIdRater, bookingId, ratingType } = req.query;
  const whereClause = {};
  
  if (teamIdRated) whereClause.teamIdRated = teamIdRated;
  if (teamIdRater) whereClause.teamIdRater = teamIdRater;
  if (bookingId) whereClause.bookingId = bookingId;
  if (ratingType) whereClause.ratingType = ratingType;

  const ratings = await Rating.findAll({
    where: whereClause,
    include: [
      { model: Team, as: 'raterTeam' },
      { model: Team, as: 'ratedTeam' },
      { model: Booking, as: 'booking' }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: ratings });
}));

app.get('/api/ratings/:id', asyncHandler(async (req, res) => {
  const rating = await Rating.findByPk(req.params.id, {
    include: [
      { model: Team, as: 'raterTeam' },
      { model: Team, as: 'ratedTeam' },
      { model: Booking, as: 'booking' }
    ]
  });
  if (!rating) {
    return res.status(404).json({ success: false, message: 'Rating not found' });
  }
  res.json({ success: true, data: rating });
}));

app.post('/api/ratings', asyncHandler(async (req, res) => {
  const rating = await Rating.create(req.body);
  res.status(201).json({ success: true, data: rating });
}));

// ============= DASHBOARD/STATS API =============
app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFields,
    totalBookings,
    totalTeams,
    activeBookings,
    completedMatches
  ] = await Promise.all([
    User.count(),
    Field.count(),
    Booking.count(),
    Team.count(),
    Booking.count({ where: { status: 'confirmed' } }),
    MatchResult.count({ where: { matchStatus: 'completed' } })
  ]);

  const stats = {
    users: totalUsers,
    fields: totalFields,
    bookings: totalBookings,
    teams: totalTeams,
    activeBookings,
    completedMatches
  };

  res.json({ success: true, data: stats });
}));

// ============= SEARCH API =============
app.get('/api/search', asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  let results = {};

  if (!type || type === 'users') {
    results.users = await User.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { username: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { email: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { firstName: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { lastName: { [sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  if (!type || type === 'fields') {
    results.fields = await Field.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { description: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { address: { [sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  if (!type || type === 'teams') {
    results.teams = await Team.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.like]: `%${q}%` } },
          { description: { [sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  res.json({ success: true, data: results });
}));

// ============= Start Server =============
const startServer = async () => {
  try {
    // Database connection check
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Environment-safe database sync
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    
    if (isDevelopment) {
      // In development, sync without force to preserve data
      console.log('Development mode: Synchronizing database schema...');
      await sequelize.sync({ alter: true });
      console.log('Database schema synchronized successfully.');
    } else if (isTest) {
      // In test mode, force recreate for clean state
      console.log('Test mode: Recreating database...');
      await sequelize.sync({ force: true });
      console.log('Test database recreated successfully.');
    } else {
      // In production, only sync without alterations
      console.log('Production mode: Synchronizing database safely...');
      await sequelize.sync();
      console.log('Database synchronized safely.');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Please check your database configuration and ensure MySQL is running.');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();
