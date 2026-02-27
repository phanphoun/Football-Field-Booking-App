const { Booking, Field, User, Team } = require('../models');
const { Op } = require('sequelize');

const createBooking = async (req, res) => {
  try {
    const { fieldId, startTime, endTime, teamId } = req.body;
    
    // Validate required fields
    if (!fieldId || !startTime || !endTime || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'fieldId, startTime, endTime, and teamId are required'
      });
    }
    
    // Check if field exists
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    // Calculate duration and price
    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // hours
    const totalPrice = duration * parseFloat(field.pricePerHour);

    // Check availability
    const existingBooking = await Booking.findOne({
      where: {
        fieldId,
        status: { [Op.ne]: 'cancelled' },
        [Op.and]: [
            { startTime: { [Op.lt]: endTime } },
            { endTime: { [Op.gt]: startTime } }
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
      fieldId,
      teamId,
      startTime,
      endTime,
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid'
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

const processBookingPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const allowedMethods = ['card', 'cash', 'bank_transfer', 'wallet'];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod must be one of: ${allowedMethods.join(', ')}`
      });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field' }]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBooker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking.'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot pay for a cancelled booking.'
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid.'
      });
    }

    const transactionId = `TXN-${Date.now()}-${booking.id}`;

    await booking.update({
      paymentStatus: 'paid',
      paymentMethod,
      transactionId,
      paidAt: new Date()
    });

    return res.json({
      success: true,
      message: 'Payment processed successfully.',
      data: booking
    });
  } catch (error) {
    console.error('Process booking payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
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

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  processBookingPayment
};
