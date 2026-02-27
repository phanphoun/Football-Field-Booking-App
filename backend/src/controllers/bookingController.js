const { Booking, Field, User } = require('../models');
const { Op } = require('sequelize');

const createBooking = async (req, res) => {
  try {
    const { fieldId, startTime, endTime } = req.body;
    
    // Check if field exists
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

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
      userId: req.user.id,
      fieldId,
      startTime,
      endTime,
      status: 'pending'
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    let where = {};
    
    // If user is a normal player/captain, only show their bookings
    if (req.user.role === 'player' || req.user.role === 'captain' || req.user.role === 'guest') {
       where = { userId: req.user.id };
    }
    // If field_owner, show bookings for their fields (logic slightly more complex, let's simplify for now)
    // Actually, field_owner should see bookings for fields they own.
    if (req.user.role === 'field_owner') {
      const fields = await Field.findAll({ where: { ownerId: req.user.id }, attributes: ['id'] });
      const fieldIds = fields.map(f => f.id);
      where = { fieldId: { [Op.in]: fieldIds } };
    }
    // Admin sees all (empty where)

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Field, as: 'field', attributes: ['name', 'location'] },
        { model: User, as: 'booker', attributes: ['username', 'email'] }
      ]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field', attributes: ['name', 'location'] },
        { model: User, as: 'booker', attributes: ['username', 'email'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Authorization check
    const isBooker = booking.userId === req.user.id;
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

    res.json(booking);
  } catch (error) {
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
    const isOwner = booking.field.ownerId === req.user.id;
    const isBooker = booking.userId === req.user.id;
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

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus
};
