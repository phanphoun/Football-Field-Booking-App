const { Booking, Field, User, Team, TeamMember, Notification } = require('../models');
const { Op } = require('sequelize');

const bookingIncludes = [
  { model: Field, as: 'field', attributes: ['id', 'name', 'address', 'pricePerHour', 'ownerId'] },
  { model: Team, as: 'team', attributes: ['id', 'name', 'skillLevel', 'maxPlayers', 'captainId'], required: false },
  { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'], required: false },
  { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
];

const isTeamMemberOrCaptain = async (teamId, userId) => {
  const team = await Team.findByPk(teamId);
  if (!team) return { ok: false, team: null };

  if (Number(team.captainId) === Number(userId)) {
    return { ok: true, team };
  }

  const membership = await TeamMember.findOne({
    where: {
      teamId,
      userId,
      isActive: true,
      status: 'accepted'
    }
  });

  return { ok: Boolean(membership), team };
};

const createNotificationSafe = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error('Notification create error:', error.message);
  }
};

const createBooking = async (req, res) => {
  try {
    const { fieldId, startTime, endTime, teamId } = req.body;
    const isMatchmaking = req.body.isMatchmaking === true || req.body.openMatch === true;
    const parsedFieldId = Number(fieldId);
    const parsedTeamId = Number(teamId);
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    
    // Validate required fields
    if (!parsedFieldId || !startTime || !endTime || !parsedTeamId) {
      return res.status(400).json({
        success: false,
        message: 'fieldId, startTime, endTime, and teamId are required'
      });
    }

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end time format'
      });
    }

    if (parsedStart <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }
    
    // Check if field exists
    const field = await Field.findByPk(parsedFieldId);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    if (field.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Field is currently not available for booking' });
    }

    const team = await Team.findByPk(parsedTeamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // User must be team captain or an active/accepted team member (admin bypass).
    if (req.user.role !== 'admin') {
      const isCaptain = Number(team.captainId) === Number(req.user.id);
      const membership = await TeamMember.findOne({
        where: {
          teamId: parsedTeamId,
          userId: req.user.id,
          isActive: true,
          status: 'accepted'
        }
      });

      if (!isCaptain && !membership) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this team to create a booking'
        });
      }
    }

    // Calculate duration and price
    const duration = (parsedEnd - parsedStart) / (1000 * 60 * 60); // hours
    if (duration <= 0 || duration > 8) {
      return res.status(400).json({
        success: false,
        message: 'Booking duration must be between 0 and 8 hours'
      });
    }
    const totalPrice = duration * parseFloat(field.pricePerHour);

    // Check availability
    const existingBooking = await Booking.findOne({
      where: {
        fieldId: parsedFieldId,
        status: { [Op.ne]: 'cancelled' },
        [Op.and]: [
            { startTime: { [Op.lt]: parsedEnd } },
            { endTime: { [Op.gt]: parsedStart } }
        ]
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Field is already booked for this time slot.'
      });
    }

    const booking = await Booking.create({
      createdBy: req.user.id,
      fieldId: parsedFieldId,
      teamId: parsedTeamId,
      startTime: parsedStart,
      endTime: parsedEnd,
      totalPrice,
      status: 'pending',
      isMatchmaking
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

const getBookings = async (req, res) => {
  try {
    let where = {};
    
    // If user is a normal player/captain, only show their bookings
    if (req.user.role === 'player' || req.user.role === 'captain' || req.user.role === 'guest') {
       where = { createdBy: req.user.id };
    }
    // If field_owner, show bookings for their fields
    if (req.user.role === 'field_owner') {
      const fields = await Field.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] });
      const fieldIds = fields.map(f => f.id);
      where = { fieldId: { [Op.in]: fieldIds } };
    }
    // Admin sees all (empty where)

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Field, as: 'field', attributes: ['name', 'address', 'pricePerHour'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'skillLevel', 'maxPlayers'], required: false },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field', attributes: ['name', 'address', 'pricePerHour'] },
        { model: Team, as: 'team', attributes: ['id', 'name', 'skillLevel', 'maxPlayers'], required: false },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization check
    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // If field owner, check if they own the field
    let isOwner = false;
    if (req.user.role === 'field_owner') {
      const field = await Field.findByPk(booking.fieldId);
      isOwner = field && field.ownerId === req.user.id;
    }

    if (!isBooker && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking.'
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization logic
    const isOwner = booking.field && booking.field.ownerId === req.user.id;
    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isBooker && status === 'cancelled') {
        // Booker can only cancel
        if (booking.status !== 'pending') {
             return res.status(400).json({
               success: false,
               message: 'Can only cancel pending bookings.'
             });
        }
    } else if (isOwner || isAdmin) {
        // Owner/Admin can set any status
    } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking.'
        });
    }

    await booking.update({ status });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

const getOpenMatches = async (req, res) => {
  try {
    const now = new Date();
    const where = {
      status: 'pending',
      isMatchmaking: true,
      opponentTeamId: null,
      startTime: { [Op.gt]: now }
    };

    const openMatches = await Booking.findAll({
      where,
      include: bookingIncludes,
      order: [['startTime', 'ASC']]
    });

    res.json({ success: true, data: openMatches });
  } catch (error) {
    console.error('Get open matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open matches',
      error: error.message
    });
  }
};

const joinOpenMatch = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const teamId = Number(req.body.teamId);

    if (!Number.isInteger(bookingId) || bookingId <= 0 || !Number.isInteger(teamId) || teamId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'booking id and teamId must be positive integers'
      });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Field, as: 'field', attributes: ['id', 'name', 'ownerId'] }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'pending' || !booking.isMatchmaking || booking.opponentTeamId) {
      return res.status(400).json({
        success: false,
        message: 'This booking is not available for joining'
      });
    }

    if (Number(booking.teamId) === teamId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot join with the same team as Team 1'
      });
    }

    if (req.user.role !== 'admin') {
      const { ok } = await isTeamMemberOrCaptain(teamId, req.user.id);
      if (!ok) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this team to join the match'
        });
      }
    }

    await booking.update({
      opponentTeamId: teamId
    });

    const updatedBooking = await Booking.findByPk(booking.id, {
      include: bookingIncludes
    });

    const ownerId = updatedBooking?.field?.ownerId;
    if (ownerId) {
      const team1Name = updatedBooking?.team?.name || 'Team 1';
      const team2Name = updatedBooking?.opponentTeam?.name || 'Team 2';
      await createNotificationSafe({
        userId: ownerId,
        title: 'Match requires confirmation',
        message: `${team1Name} vs ${team2Name} requested a match at ${updatedBooking?.field?.name || 'your field'}.`,
        type: 'booking',
        metadata: {
          bookingId: updatedBooking.id,
          teamId: updatedBooking.teamId,
          opponentTeamId: updatedBooking.opponentTeamId,
          status: 'pending_owner_confirmation'
        }
      });
    }

    return res.json({
      success: true,
      data: updatedBooking,
      message: 'Joined match successfully. Waiting for owner confirmation.'
    });
  } catch (error) {
    console.error('Join open match error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join open match',
      error: error.message
    });
  }
};

const notifyTeamsMatchConfirmed = async (booking) => {
  const teamOneCaptainId = booking?.team?.captainId;
  const teamTwoCaptainId = booking?.opponentTeam?.captainId;
  const title = 'Your match is confirmed';
  const message = `${booking?.team?.name || 'Team 1'} vs ${booking?.opponentTeam?.name || 'Team 2'} at ${booking?.field?.name || 'Field'} on ${new Date(booking.startTime).toLocaleString()}.`;

  if (teamOneCaptainId) {
    await createNotificationSafe({
      userId: teamOneCaptainId,
      title,
      message,
      type: 'booking',
      metadata: { bookingId: booking.id, status: 'confirmed' }
    });
  }

  if (teamTwoCaptainId && teamTwoCaptainId !== teamOneCaptainId) {
    await createNotificationSafe({
      userId: teamTwoCaptainId,
      title,
      message,
      type: 'booking',
      metadata: { bookingId: booking.id, status: 'confirmed' }
    });
  }
};

const confirmMatch = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field', attributes: ['id', 'name', 'ownerId'] }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.field && booking.field.ownerId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this match.'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    if (!booking.teamId || !booking.opponentTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Both teams must be assigned before confirming the match'
      });
    }

    await booking.update({ status: 'confirmed' });

    const updatedBooking = await Booking.findByPk(booking.id, {
      include: bookingIncludes
    });
    await notifyTeamsMatchConfirmed(updatedBooking);

    return res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Confirm match error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm match',
      error: error.message
    });
  }
};

const confirmBookingTeams = async (req, res) => {
  try {
    const teamId = Number(req.body.teamId);
    const opponentTeamId = Number(req.body.opponentTeamId);

    if (!Number.isInteger(teamId) || teamId <= 0 || !Number.isInteger(opponentTeamId) || opponentTeamId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'teamId and opponentTeamId must be positive integers'
      });
    }

    if (teamId === opponentTeamId) {
      return res.status(400).json({
        success: false,
        message: 'The two teams must be different'
      });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.field && booking.field.ownerId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm teams for this booking.'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be finalized with team confirmation.'
      });
    }

    const [team, opponentTeam] = await Promise.all([Team.findByPk(teamId), Team.findByPk(opponentTeamId)]);
    if (!team || !opponentTeam) {
      return res.status(404).json({
        success: false,
        message: 'One or both teams were not found'
      });
    }

    await booking.update({
      teamId,
      opponentTeamId,
      status: 'confirmed'
    });

    const updatedBooking = await Booking.findByPk(booking.id, { include: bookingIncludes });
    await notifyTeamsMatchConfirmed(updatedBooking);

    return res.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Confirm booking teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm teams for booking',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getOpenMatches,
  joinOpenMatch,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmMatch,
  confirmBookingTeams
};
