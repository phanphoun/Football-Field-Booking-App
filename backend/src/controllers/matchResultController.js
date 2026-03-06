const { MatchResult, Booking, Team, User, Field, Notification } = require('../models');

const createNotificationSafe = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error('Notification create error:', error.message);
  }
};

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
    const { bookingId, homeTeamId, awayTeamId, homeScore, awayScore, matchNotes } = req.body;
    const parsedBookingId = Number(bookingId);
    const parsedHomeTeamId = Number(homeTeamId);
    const parsedAwayTeamId = Number(awayTeamId);
    const parsedHomeScore = Number(homeScore);
    const parsedAwayScore = Number(awayScore);

    if (!Number.isInteger(parsedBookingId) || !Number.isInteger(parsedHomeTeamId) || !Number.isInteger(parsedAwayTeamId)) {
      return res.status(400).json({ success: false, message: 'bookingId, homeTeamId, and awayTeamId are required' });
    }

    if (!Number.isInteger(parsedHomeScore) || parsedHomeScore < 0 || !Number.isInteger(parsedAwayScore) || parsedAwayScore < 0) {
      return res.status(400).json({ success: false, message: 'homeScore and awayScore must be non-negative integers' });
    }

    const booking = await Booking.findByPk(parsedBookingId, {
      include: [
        { model: Field, as: 'field', attributes: ['id', 'name', 'ownerId'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isFieldOwner = req.user.role === 'field_owner' && booking.field?.ownerId === req.user.id;
    if (!isAdmin && !isFieldOwner) {
      return res.status(403).json({ success: false, message: 'Only field owner or admin can record match result' });
    }

    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Match result can be recorded only for confirmed/completed bookings' });
    }

    const bookingTeamIds = [Number(booking.teamId), Number(booking.opponentTeamId)];
    if (!bookingTeamIds.includes(parsedHomeTeamId) || !bookingTeamIds.includes(parsedAwayTeamId) || parsedHomeTeamId === parsedAwayTeamId) {
      return res.status(400).json({ success: false, message: 'homeTeamId and awayTeamId must match booking teams' });
    }

    const existing = await MatchResult.findOne({ where: { bookingId: parsedBookingId } });
    let matchResult;

    if (existing) {
      matchResult = await existing.update({
        homeTeamId: parsedHomeTeamId,
        awayTeamId: parsedAwayTeamId,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
        matchStatus: 'completed',
        matchNotes: matchNotes || existing.matchNotes || null,
        recordedBy: req.user.id,
        recordedAt: new Date()
      });
    } else {
      matchResult = await MatchResult.create({
        bookingId: parsedBookingId,
        homeTeamId: parsedHomeTeamId,
        awayTeamId: parsedAwayTeamId,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
        matchStatus: 'completed',
        matchNotes: matchNotes || null,
        recordedBy: req.user.id
      });
    }

    if (booking.status !== 'completed') {
      await booking.update({ status: 'completed' });
    }

    const teamOneCaptainId = booking.team?.captainId;
    const teamTwoCaptainId = booking.opponentTeam?.captainId;
    const notice = `Match completed: ${booking.team?.name || 'Team 1'} ${parsedHomeScore} - ${parsedAwayScore} ${booking.opponentTeam?.name || 'Team 2'}. You can now rate your opponent.`;

    if (teamOneCaptainId) {
      await createNotificationSafe({
        userId: teamOneCaptainId,
        title: 'Match completed - Rate opponent',
        message: notice,
        type: 'match_result',
        metadata: { bookingId: booking.id, matchResultId: matchResult.id }
      });
    }
    if (teamTwoCaptainId && teamTwoCaptainId !== teamOneCaptainId) {
      await createNotificationSafe({
        userId: teamTwoCaptainId,
        title: 'Match completed - Rate opponent',
        message: notice,
        type: 'match_result',
        metadata: { bookingId: booking.id, matchResultId: matchResult.id }
      });
    }

    res.status(existing ? 200 : 201).json({ success: true, data: matchResult });
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
