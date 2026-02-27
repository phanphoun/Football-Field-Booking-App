const { Team, User, Booking, TeamMember } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllTeams = asyncHandler(async (req, res) => {
  const teams = await Team.findAll({
    include: [
      { model: User, as: 'captain', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: User, as: 'players', through: { attributes: ['role', 'status', 'joinedAt', 'isActive'] } },
      { model: Booking, as: 'bookings' },
      { model: Booking, as: 'opponentBookings' }
    ]
  });
  res.json({ success: true, data: teams });
});

const getTeamById = asyncHandler(async (req, res) => {
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
});

const createTeam = asyncHandler(async (req, res) => {
  const team = await Team.create({
    ...req.body,
    captainId: req.user.id
  });
  res.status(201).json({ success: true, data: team });
});

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam
};
