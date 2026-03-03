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
  try {
    const matchResult = await MatchResult.create({
      ...req.body,
      recordedBy: req.user.id
    });
    res.status(201).json({ success: true, data: matchResult });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateMatchResult = asyncHandler(async (req, res) => {
  try {
    const matchResult = await MatchResult.findByPk(req.params.id);
    
    if (!matchResult) {
      return res.status(404).json({ success: false, message: 'Match result not found' });
    }
    
    // Authorization check
    if (matchResult.recordedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this match result' });
    }
    
    const updatedMatchResult = await matchResult.update(req.body);
    res.json({ success: true, data: updatedMatchResult });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const deleteMatchResult = asyncHandler(async (req, res) => {
  try {
    const matchResult = await MatchResult.findByPk(req.params.id);
    
    if (!matchResult) {
      return res.status(404).json({ success: false, message: 'Match result not found' });
    }
    
    // Authorization check
    if (matchResult.recordedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this match result' });
    }
    
    await matchResult.destroy();
    res.json({ success: true, message: 'Match result deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllMatchResults,
  getMatchResultById,
  createMatchResult,
  updateMatchResult,
  deleteMatchResult
};
