const { Booking, Field, User, Team, TeamMember, BookingJoinRequest, MatchResult, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

const BOOKING_BASE_INCLUDE = [
  { model: Field, as: 'field', attributes: ['name', 'address', 'pricePerHour'] },
  {
    model: Team,
    as: 'team',
    attributes: ['id', 'name', 'skillLevel', 'maxPlayers', 'captainId'],
    include: [
      {
        model: User,
        as: 'captain',
        attributes: ['id', 'username', 'firstName', 'lastName']
      },
      {
        model: TeamMember,
        as: 'teamMembers',
        attributes: ['userId', 'role', 'status', 'isActive'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ],
        required: false
      }
    ],
    required: false
  },
  { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'], required: false },
  { model: MatchResult, as: 'matchResult', attributes: ['id', 'homeScore', 'awayScore', 'matchStatus', 'recordedAt', 'recordedBy'], required: false },
  { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
];

const serializeBooking = (booking) => {
  const payload = booking && typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
  if (!payload) return payload;
  return {
    ...payload,
    openForOpponents: Boolean(payload.isMatchmaking)
  };
};

const requireCaptainRole = (req, res) => {
  if (req.user.role !== 'captain') {
    res.status(403).json({
      success: false,
      message: 'Only team captains can use this feature.'
    });
    return false;
  }
  return true;
};

const isClosedStatus = (booking) => booking.status === 'cancelled' || booking.status === 'completed';
const isUnavailableForJoin = (booking) =>
  isClosedStatus(booking) || new Date(booking.startTime) <= new Date();

const createBooking = async (req, res) => {
  try {
    const { fieldId, startTime, endTime, teamId } = req.body;

    if (!fieldId || !startTime || !endTime || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'fieldId, startTime, endTime, and teamId are required'
      });
    }

    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
    const totalPrice = duration * parseFloat(field.pricePerHour);

    const existingBooking = await Booking.findOne({
      where: {
        fieldId,
        status: 'confirmed',
        [Op.and]: [{ startTime: { [Op.lt]: endTime } }, { endTime: { [Op.gt]: startTime } }]
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Field already has a confirmed booking for this time slot.'
      });
    }

    const booking = await Booking.create({
      createdBy: req.user.id,
      fieldId,
      teamId,
      startTime,
      endTime,
      totalPrice,
      status: 'pending',
      isMatchmaking: false
    });

    if (field.ownerId) {
      const team = await Team.findByPk(teamId, { attributes: ['id', 'name'] });
      await Notification.create({
        userId: field.ownerId,
        title: `New booking request for ${field.name}`,
        message: `${team?.name || 'A team'} requested to book your field.`,
        type: 'booking',
        metadata: {
          event: 'booking_request',
          bookingId: booking.id,
          fieldId: field.id,
          fieldName: field.name,
          teamId: team?.id || teamId,
          teamName: team?.name || null,
          startTime,
          endTime,
          totalPrice,
          status: 'pending'
        }
      });
    }

    res.status(201).json({ success: true, data: serializeBooking(booking) });
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

    if (req.user.role === 'player' || req.user.role === 'guest') {
      where = { createdBy: req.user.id };
    }
    if (req.user.role === 'captain') {
      const captainedTeams = await Team.findAll({
        where: { captainId: req.user.id },
        attributes: ['id']
      });
      const captainedTeamIds = captainedTeams.map((team) => team.id);

      if (captainedTeamIds.length > 0) {
        where = {
          [Op.or]: [
            { createdBy: req.user.id },
            { teamId: { [Op.in]: captainedTeamIds } },
            { opponentTeamId: { [Op.in]: captainedTeamIds } }
          ]
        };
      } else {
        where = { createdBy: req.user.id };
      }
    }
    if (req.user.role === 'field_owner') {
      const fields = await Field.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] });
      const fieldIds = fields.map((f) => f.id);
      where = { fieldId: { [Op.in]: fieldIds } };
    }

    const bookings = await Booking.findAll({
      where,
      include: BOOKING_BASE_INCLUDE,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: bookings.map(serializeBooking) });
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
      include: BOOKING_BASE_INCLUDE
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';

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

    res.json({ success: true, data: serializeBooking(booking) });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

const getBookingSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date query is required (YYYY-MM-DD)'
      });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    const [fields, bookings] = await Promise.all([
      Field.findAll({
        order: [['name', 'ASC']]
      }),
      Booking.findAll({
        where: {
          status: { [Op.notIn]: ['cancelled', 'completed'] },
          [Op.and]: [{ startTime: { [Op.lt]: dayEnd } }, { endTime: { [Op.gt]: dayStart } }]
        },
        include: BOOKING_BASE_INCLUDE,
        order: [['startTime', 'ASC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        fields,
        bookings: bookings.map(serializeBooking)
      }
    });
  } catch (error) {
    console.error('Get booking schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking schedule',
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
      include: [
        { model: Field, as: 'field' },
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.field && booking.field.ownerId === req.user.id;
    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isTeamCaptain = booking.team && booking.team.captainId === req.user.id;
    const isCaptain = req.user.role === 'captain';

    if ((isBooker || (isCaptain && isTeamCaptain)) && status === 'cancelled') {
      const canCancelStatus = booking.status === 'pending' || booking.status === 'confirmed';
      if (!canCancelStatus) {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending or confirmed bookings.'
        });
      }
    } else if (isOwner || isAdmin) {
      // field owner/admin
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking.'
      });
    }

    const previousStatus = booking.status;

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      const overlappingConfirmed = await Booking.findOne({
        where: {
          id: { [Op.ne]: booking.id },
          fieldId: booking.fieldId,
          status: 'confirmed',
          [Op.and]: [{ startTime: { [Op.lt]: booking.endTime } }, { endTime: { [Op.gt]: booking.startTime } }]
        }
      });
      if (overlappingConfirmed) {
        return res.status(400).json({
          success: false,
          message: 'Another booking is already confirmed for this time slot.'
        });
      }
    }

    await booking.update({ status });

    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      const teamName = booking.team?.name || 'Team';
      const opponentTeamName = booking.opponentTeam?.name || null;
      const actorName = req.user.firstName || req.user.username || 'Field owner';
      const fieldName = booking.field?.name || 'the field';

      const recipients = new Set();
      if (booking.team?.captainId) recipients.add(booking.team.captainId);
      if (booking.opponentTeam?.captainId) recipients.add(booking.opponentTeam.captainId);

      if (recipients.size > 0) {
        await Notification.bulkCreate(
          Array.from(recipients).map((captainId) => ({
            userId: captainId,
            title: 'Booking confirmed',
            message: opponentTeamName
              ? `${actorName} confirmed your booking at ${fieldName}: ${teamName} vs ${opponentTeamName}.`
              : `${actorName} confirmed your booking at ${fieldName} for ${teamName}.`,
            type: 'booking',
            metadata: {
              event: 'booking_confirmed',
              bookingId: booking.id,
              fieldName,
              teamName,
              opponentTeamName,
              confirmedByUserId: req.user.id
            }
          }))
        );
      }

      const overlappingPending = await Booking.findAll({
        where: {
          id: { [Op.ne]: booking.id },
          fieldId: booking.fieldId,
          status: 'pending',
          [Op.and]: [{ startTime: { [Op.lt]: booking.endTime } }, { endTime: { [Op.gt]: booking.startTime } }]
        },
        include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] }]
      });

      if (overlappingPending.length > 0) {
        await Booking.update(
          { status: 'cancelled' },
          { where: { id: { [Op.in]: overlappingPending.map((item) => item.id) } } }
        );

        const rejectedNotifications = [];
        for (const pendingItem of overlappingPending) {
          const pendingTeamName = pendingItem.team?.name || 'Your team';
          const recipientId = pendingItem.team?.captainId || pendingItem.createdBy;
          if (!recipientId) continue;

          rejectedNotifications.push({
            userId: recipientId,
            title: 'Booking request was not selected',
            message: `Your request for ${fieldName} (${pendingTeamName}) was cancelled because another team was accepted.`,
            type: 'booking',
            metadata: {
              event: 'booking_rejected_by_competing_confirmation',
              bookingId: pendingItem.id,
              winningBookingId: booking.id,
              fieldName,
              teamName: pendingTeamName
            }
          });
        }

        if (rejectedNotifications.length > 0) {
          await Notification.bulkCreate(rejectedNotifications);
        }
      }
    }

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      const teamName = booking.team?.name || 'Team';
      const opponentTeamName = booking.opponentTeam?.name || null;
      const cancellerName =
        req.user.role === 'field_owner' ? 'Field owner' : req.user.firstName || req.user.username || 'A user';

      const recipients = new Set();
      if (booking.team?.captainId) recipients.add(booking.team.captainId);
      if (booking.opponentTeam?.captainId) recipients.add(booking.opponentTeam.captainId);

      if (recipients.size > 0) {
        await Notification.bulkCreate(
          Array.from(recipients).map((captainId) => ({
            userId: captainId,
            title: 'Booking cancelled',
            message: opponentTeamName
              ? `${cancellerName} cancelled the booking for ${teamName} vs ${opponentTeamName}.`
              : `${cancellerName} cancelled the booking for ${teamName}.`,
            type: 'booking',
            metadata: {
              event: 'booking_cancelled',
              bookingId: booking.id,
              teamName,
              opponentTeamName,
              cancelledByUserId: req.user.id
            }
          }))
        );
      }
    }

    res.json({ success: true, data: serializeBooking(booking) });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

const confirmMatchTeams = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field' },
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'] }
      ]
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
        message: `Only pending bookings can be confirmed as a match. Current status: ${booking.status}`
      });
    }

    if (!booking.teamId || !booking.opponentTeamId || !booking.team || !booking.opponentTeam) {
      return res.status(400).json({
        success: false,
        message: 'Match cannot be confirmed until both teams are assigned.'
      });
    }

    const overlappingConfirmed = await Booking.findOne({
      where: {
        id: { [Op.ne]: booking.id },
        fieldId: booking.fieldId,
        status: 'confirmed',
        [Op.and]: [{ startTime: { [Op.lt]: booking.endTime } }, { endTime: { [Op.gt]: booking.startTime } }]
      }
    });
    if (overlappingConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Another booking is already confirmed for this time slot.'
      });
    }

    await booking.update({ status: 'confirmed', isMatchmaking: false });

    const homeTeamName = booking.team.name;
    const awayTeamName = booking.opponentTeam.name;
    const recipients = new Set();
    if (booking.team.captainId) recipients.add(booking.team.captainId);
    if (booking.opponentTeam.captainId) recipients.add(booking.opponentTeam.captainId);

    if (recipients.size > 0) {
      await Notification.bulkCreate(
        Array.from(recipients).map((captainId) => {
          const isHomeCaptain = Number(captainId) === Number(booking.team.captainId);
          const ownTeamName = isHomeCaptain ? homeTeamName : awayTeamName;
          const otherTeamName = isHomeCaptain ? awayTeamName : homeTeamName;
          return {
            userId: captainId,
            title: 'Match confirmed',
            message: `Your match with ${otherTeamName} has been confirmed.`,
            type: 'booking',
            metadata: {
              event: 'match_teams_confirmed',
              bookingId: booking.id,
              fieldId: booking.fieldId,
              fieldName: booking.field?.name || null,
              ownTeamName,
              opponentTeamName: otherTeamName,
              confirmedByUserId: req.user.id
            }
          };
        })
      );
    }

    const refreshed = await Booking.findByPk(booking.id, { include: BOOKING_BASE_INCLUDE });
    res.json({
      success: true,
      data: serializeBooking(refreshed),
      message: `Match confirmed: ${homeTeamName} vs ${awayTeamName}`
    });
  } catch (error) {
    console.error('Confirm match teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm match teams',
      error: error.message
    });
  }
};

const toggleOpenForOpponents = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;
    const requestedOpenFlag = req.body.openForOpponents;
    const requestedMatchmakingFlag = req.body.isMatchmaking;
    const openForOpponents = typeof requestedOpenFlag === 'boolean' ? requestedOpenFlag : requestedMatchmakingFlag;

    if (typeof openForOpponents !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'openForOpponents (or isMatchmaking) must be a boolean'
      });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Team, as: 'team', attributes: ['id', 'captainId', 'name'] }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.team || booking.team.captainId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking owner team captain can manage Open for Opponents.'
      });
    }

    if (isClosedStatus(booking)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot open or close matchmaking for cancelled/completed bookings.'
      });
    }

    if (openForOpponents && booking.opponentTeamId) {
      return res.status(400).json({
        success: false,
        message: 'This booking already has an opponent team.'
      });
    }

    const wasMatchmaking = Boolean(booking.isMatchmaking);
    await booking.update({ isMatchmaking: openForOpponents });

    if (!wasMatchmaking && openForOpponents) {
      const audience = await User.findAll({
        where: {
          id: { [Op.ne]: req.user.id },
          role: { [Op.in]: ['player', 'captain'] },
          status: 'active'
        },
        attributes: ['id']
      });

      if (audience.length > 0) {
        await Notification.bulkCreate(
          audience.map((u) => ({
            userId: u.id,
            title: 'New Open Match',
            message: `${booking.team.name} opened a match for opponents.`,
            type: 'system',
            metadata: {
              event: 'open_match_created',
              bookingId: booking.id,
              teamId: booking.team.id
            }
          }))
        );
      }
    }

    if (!openForOpponents) {
      const pendingRequests = await BookingJoinRequest.findAll({
        where: { bookingId: booking.id, status: 'pending' },
        include: [{ model: Team, as: 'requesterTeam', attributes: ['id', 'captainId', 'name'] }]
      });

      if (pendingRequests.length > 0) {
        await BookingJoinRequest.update(
          {
            status: 'rejected',
            respondedAt: new Date(),
            respondedBy: req.user.id
          },
          {
            where: { bookingId: booking.id, status: 'pending' }
          }
        );

        await Notification.bulkCreate(
          pendingRequests
            .filter((request) => request.requesterTeam?.captainId)
            .map((request) => ({
              userId: request.requesterTeam.captainId,
              title: 'Join request closed',
              message: `Open match for "${booking.team.name}" is no longer available.`,
              type: 'system',
              metadata: { event: 'booking_join_closed', bookingId: booking.id, requestId: request.id }
            }))
        );
      }
    }

    const updatedBooking = await Booking.findByPk(req.params.id, { include: BOOKING_BASE_INCLUDE });
    res.json({ success: true, data: serializeBooking(updatedBooking) });
  } catch (error) {
    console.error('Toggle openForOpponents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update open match status',
      error: error.message
    });
  }
};

const getOpenMatches = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;

    const where = {
      isMatchmaking: true,
      opponentTeamId: null,
      status: { [Op.notIn]: ['cancelled', 'completed'] },
      startTime: { [Op.gt]: new Date() }
    };

    const captainedTeams = await Team.findAll({
      where: { captainId: req.user.id },
      attributes: ['id']
    });
    const captainedTeamIds = captainedTeams.map((team) => team.id);
    if (captainedTeamIds.length > 0) {
      where.teamId = { [Op.notIn]: captainedTeamIds };
    }

    const bookings = await Booking.findAll({
      where,
      include: BOOKING_BASE_INCLUDE,
      order: [['startTime', 'ASC']]
    });

    const openMatches = bookings.map(serializeBooking);

    if (captainedTeamIds.length > 0 && openMatches.length > 0) {
      const requests = await BookingJoinRequest.findAll({
        where: {
          bookingId: { [Op.in]: openMatches.map((b) => b.id) },
          requesterTeamId: { [Op.in]: captainedTeamIds }
        },
        attributes: ['id', 'bookingId', 'requesterTeamId', 'status', 'createdAt']
      });

      const requestsByBookingId = requests.reduce((acc, request) => {
        if (!acc[request.bookingId]) acc[request.bookingId] = [];
        acc[request.bookingId].push(request);
        return acc;
      }, {});

      for (const booking of openMatches) {
        booking.myRequests = requestsByBookingId[booking.id] || [];
      }
    }

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

const requestJoinMatch = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;
    const bookingId = Number(req.params.id);
    const requesterTeamId = Number(req.body.teamId);
    const message = req.body.message || null;

    if (!Number.isInteger(requesterTeamId) || requesterTeamId <= 0) {
      return res.status(400).json({ success: false, message: 'teamId must be a positive integer' });
    }

    const requesterTeam = await Team.findOne({
      where: { id: requesterTeamId, captainId: req.user.id },
      attributes: ['id', 'name', 'captainId', 'skillLevel']
    });
    if (!requesterTeam) {
      return res.status(403).json({
        success: false,
        message: 'You can only request using a team where you are captain.'
      });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name'] }
      ]
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.opponentTeamId) {
      return res.status(400).json({
        success: false,
        message: `Already matched: ${booking.team?.name || 'Team'} vs ${booking.opponentTeam?.name || 'Opponent'}`
      });
    }

    if (!booking.isMatchmaking || isUnavailableForJoin(booking)) {
      return res.status(400).json({
        success: false,
        message: 'This booking is not currently open for opponents.'
      });
    }

    if (booking.teamId === requesterTeam.id) {
      return res.status(400).json({
        success: false,
        message: 'Your own team cannot request to join this booking.'
      });
    }

    const existingRequest = await BookingJoinRequest.findOne({
      where: {
        bookingId,
        requesterTeamId: requesterTeam.id
      }
    });

    let joinRequest;
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Join request already pending for this team.'
        });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'This team has already been accepted for this match.'
        });
      }

      joinRequest = await existingRequest.update({
        status: 'pending',
        message,
        requesterCaptainId: req.user.id,
        respondedAt: null,
        respondedBy: null
      });
    } else {
      joinRequest = await BookingJoinRequest.create({
        bookingId,
        requesterTeamId: requesterTeam.id,
        requesterCaptainId: req.user.id,
        message,
        status: 'pending'
      });
    }

    if (booking.team?.captainId) {
      await Notification.create({
        userId: booking.team.captainId,
        title: `Join request for ${booking.team.name}`,
        message: `${requesterTeam.name} requested to join your open match.`,
        type: 'system',
        metadata: {
          event: 'booking_join_request',
          bookingId,
          requestId: joinRequest.id,
          requesterTeamId: requesterTeam.id,
          requesterTeamName: requesterTeam.name,
          requesterTeamSkillLevel: requesterTeam.skillLevel || null,
          requesterCaptainId: req.user.id,
          requesterCaptainName: req.user.firstName || req.user.username || 'Captain',
          requestMessage: message || null
        }
      });
    }

    await Notification.create({
      userId: req.user.id,
      title: 'Join request submitted',
      message: `Your team "${requesterTeam.name}" requested to play against "${booking.team?.name || 'the host team'}".`,
      type: 'system',
      metadata: {
        event: 'booking_join_request_submitted',
        bookingId,
        requestId: joinRequest.id,
        requesterTeamId: requesterTeam.id
      }
    });

    res.status(existingRequest ? 200 : 201).json({
      success: true,
      data: joinRequest,
      message: 'Join request submitted'
    });
  } catch (error) {
    console.error('Request join match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request to join match',
      error: error.message
    });
  }
};

const getBookingJoinRequests = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;
    const bookingId = Number(req.params.id);

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.team || booking.team.captainId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking owner team captain can view join requests.'
      });
    }

    const joinRequests = await BookingJoinRequest.findAll({
      where: { bookingId },
      include: [
        {
          model: Team,
          as: 'requesterTeam',
          attributes: ['id', 'name', 'skillLevel', 'captainId'],
          include: [
            {
              model: User,
              as: 'captain',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: joinRequests });
  } catch (error) {
    console.error('Get booking join requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch join requests',
      error: error.message
    });
  }
};

const respondToJoinRequest = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;
    const bookingId = Number(req.params.id);
    const requestId = Number(req.params.requestId);
    const action = req.body.action;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be either "accept" or "reject"'
      });
    }
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'requestId must be a positive integer'
      });
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (!booking.team || booking.team.captainId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the booking owner team captain can respond to join requests.'
      });
    }

    const targetRequest = await BookingJoinRequest.findByPk(requestId, {
      include: [{ model: Team, as: 'requesterTeam', attributes: ['id', 'name', 'captainId'] }]
    });
    if (!targetRequest || targetRequest.bookingId !== bookingId) {
      return res.status(404).json({ success: false, message: 'Join request not found for this booking' });
    }
    if (targetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be processed.'
      });
    }

    const updatedRequest = await sequelize.transaction(async (transaction) => {
      if (action === 'accept') {
        if (booking.opponentTeamId) {
          throw new Error(
            `Already matched: ${booking.team?.name || 'Team'} vs ${booking.opponentTeam?.name || 'Opponent'}`
          );
        }
        if (!booking.isMatchmaking || isUnavailableForJoin(booking)) {
          throw new Error('This booking can no longer accept opponents.');
        }

        await booking.update(
          {
            opponentTeamId: targetRequest.requesterTeamId,
            isMatchmaking: false
          },
          { transaction }
        );

        await BookingJoinRequest.update(
          {
            status: 'rejected',
            respondedAt: new Date(),
            respondedBy: req.user.id
          },
          {
            where: {
              bookingId,
              status: 'pending',
              id: { [Op.ne]: targetRequest.id }
            },
            transaction
          }
        );
      }

      await targetRequest.update(
        {
          status: action === 'accept' ? 'accepted' : 'rejected',
          respondedAt: new Date(),
          respondedBy: req.user.id
        },
        { transaction }
      );

      return targetRequest;
    });

    const accepted = action === 'accept';
    if (targetRequest.requesterTeam?.captainId) {
      await Notification.create({
        userId: targetRequest.requesterTeam.captainId,
        title: `Join request ${accepted ? 'accepted' : 'rejected'}`,
        message: accepted
          ? `Your team "${targetRequest.requesterTeam.name}" has been accepted for a match against "${booking.team.name}".`
          : `Your request to join "${booking.team.name}" was rejected.`,
        type: 'system',
        metadata: {
          event: 'booking_join_request_result',
          bookingId,
          requestId: targetRequest.id,
          status: accepted ? 'accepted' : 'rejected'
        }
      });
    }

    if (accepted) {
      const pendingOthers = await BookingJoinRequest.findAll({
        where: { bookingId, status: 'rejected', id: { [Op.ne]: targetRequest.id } },
        include: [{ model: Team, as: 'requesterTeam', attributes: ['captainId', 'name'] }]
      });

      if (pendingOthers.length > 0) {
        await Notification.bulkCreate(
          pendingOthers
            .filter((request) => request.requesterTeam?.captainId)
            .map((request) => ({
              userId: request.requesterTeam.captainId,
              title: 'Join request closed',
              message: `Open match for "${booking.team.name}" has been filled by another team.`,
              type: 'system',
              metadata: {
                event: 'booking_join_closed_by_acceptance',
                bookingId,
                requestId: request.id
              }
            }))
        );
      }
    }

    res.json({
      success: true,
      data: updatedRequest,
      message: `Join request ${accepted ? 'accepted' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Respond join request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to join request',
      error: error.message
    });
  }
};

const cancelMatchedOpponent = async (req, res) => {
  try {
    if (!requireCaptainRole(req, res)) return;
    const bookingId = Number(req.params.id);

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'captainId'] },
        { model: Team, as: 'opponentTeam', attributes: ['id', 'name', 'captainId'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.opponentTeamId || !booking.opponentTeam) {
      return res.status(400).json({
        success: false,
        message: 'This booking does not have an opponent to cancel.'
      });
    }

    const isHomeCaptain = booking.team?.captainId === req.user.id;
    const isOpponentCaptain = booking.opponentTeam?.captainId === req.user.id;

    if (!isHomeCaptain && !isOpponentCaptain) {
      return res.status(403).json({
        success: false,
        message: 'Only captains of matched teams can cancel this match.'
      });
    }

    const homeTeamName = booking.team?.name || 'Team A';
    const awayTeamName = booking.opponentTeam?.name || 'Team B';
    const actorTeamName = isHomeCaptain ? homeTeamName : awayTeamName;

    await sequelize.transaction(async (transaction) => {
      await BookingJoinRequest.update(
        {
          status: 'rejected',
          respondedAt: new Date(),
          respondedBy: req.user.id
        },
        {
          where: {
            bookingId: booking.id,
            requesterTeamId: booking.opponentTeamId,
            status: 'accepted'
          },
          transaction
        }
      );

      await booking.update(
        {
          opponentTeamId: null,
          isMatchmaking: false
        },
        { transaction }
      );
    });

    const otherCaptainId = isHomeCaptain ? booking.opponentTeam?.captainId : booking.team?.captainId;
    if (otherCaptainId) {
      await Notification.create({
        userId: otherCaptainId,
        title: 'Matched opponent cancelled',
        message: `${actorTeamName} cancelled the match pairing (${homeTeamName} vs ${awayTeamName}).`,
        type: 'system',
        metadata: {
          event: 'matched_opponent_cancelled',
          bookingId: booking.id,
          homeTeamName,
          awayTeamName,
          cancelledByTeam: actorTeamName
        }
      });
    }

    await Notification.create({
      userId: req.user.id,
      title: 'Match cancelled',
      message: `You cancelled the match pairing (${homeTeamName} vs ${awayTeamName}).`,
      type: 'system',
      metadata: {
        event: 'matched_opponent_cancelled_self',
        bookingId: booking.id,
        homeTeamName,
        awayTeamName
      }
    });

    const updatedBooking = await Booking.findByPk(booking.id, { include: BOOKING_BASE_INCLUDE });
    res.json({
      success: true,
      data: serializeBooking(updatedBooking),
      message: `Matched pairing cancelled: ${homeTeamName} vs ${awayTeamName}`
    });
  } catch (error) {
    console.error('Cancel matched opponent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel matched opponent',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingSchedule,
  getBookingById,
  updateBookingStatus,
  confirmMatchTeams,
  toggleOpenForOpponents,
  getOpenMatches,
  requestJoinMatch,
  getBookingJoinRequests,
  respondToJoinRequest,
  cancelMatchedOpponent
};
