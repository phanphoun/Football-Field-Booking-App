const { MatchResult, Booking, Team, User } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllMatchResults = asyncHandler(async (req, res) => {
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
});

const getMatchResultById = asyncHandler(async (req, res) => {
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
});

const createMatchResult = asyncHandler(async (req, res) => {
  const matchResult = await MatchResult.create({
    ...req.body,
    recordedBy: req.user.id
  });
  res.status(201).json({ success: true, data: matchResult });
});

module.exports = {
  getAllMatchResults,
  getMatchResultById,
  createMatchResult
};
