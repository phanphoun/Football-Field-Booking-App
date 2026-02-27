const { User, Field, Booking, Team, MatchResult } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getDashboardStats = asyncHandler(async (req, res) => {
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
});

const searchResources = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  let results = {};

  if (!type || type === 'users') {
    results.users = await User.findAll({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          { username: { [User.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { email: { [User.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { firstName: { [User.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { lastName: { [User.sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  if (!type || type === 'fields') {
    results.fields = await Field.findAll({
      where: {
        [Field.sequelize.Sequelize.Op.or]: [
          { name: { [Field.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { description: { [Field.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { address: { [Field.sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  if (!type || type === 'teams') {
    results.teams = await Team.findAll({
      where: {
        [Team.sequelize.Sequelize.Op.or]: [
          { name: { [Team.sequelize.Sequelize.Op.like]: `%${q}%` } },
          { description: { [Team.sequelize.Sequelize.Op.like]: `%${q}%` } }
        ]
      },
      limit: 10
    });
  }

  res.json({ success: true, data: results });
});

module.exports = {
  getDashboardStats,
  searchResources
};
