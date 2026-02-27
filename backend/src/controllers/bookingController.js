const { Booking, Field, User } = require('../models');
const { Op } = require('sequelize');

const createBooking = async (req, res) => {
  try {
    const { fieldId, startTime, endTime, teamId } = req.body;
    
    // Validate required fields
    if (!fieldId || !startTime || !endTime || !teamId) {
      return res.status(400).json({ error: 'fieldId, startTime, endTime, and teamId are required' });
    }
    
    // Check if field exists
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
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
      return res.status(400).json({ error: 'Field is already booked for this time slot.' });
    }

    const booking = await Booking.create({
      createdBy: req.user.id,
      fieldId,
      teamId,
      startTime,
      endTime,
      totalPrice,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message });
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
        { model: User, as: 'creator', attributes: ['username', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field', attributes: ['name', 'address', 'pricePerHour'] },
        { model: User, as: 'creator', attributes: ['username', 'email', 'firstName', 'lastName'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
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
      return res.status(403).json({ error: 'Not authorized to view this booking.' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field' }]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Authorization logic
    const isOwner = booking.field && booking.field.ownerId === req.user.id;
    const isBooker = booking.createdBy === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isBooker && status === 'cancelled') {
        // Booker can only cancel
        if (booking.status !== 'pending') {
             return res.status(400).json({ error: 'Can only cancel pending bookings.' });
        }
    } else if (isOwner || isAdmin) {
        // Owner/Admin can set any status
    } else {
        return res.status(403).json({ error: 'Not authorized to update this booking.' });
    }

    await booking.update({ status });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus
};
