const { User, Field, Booking, Team, Notification } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'bookings' },
      { model: Team, as: 'teams', through: { attributes: [] } },
      { model: Notification, as: 'notifications' }
    ]
  });
  res.json({ success: true, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'bookings' },
      { model: Team, as: 'teams', through: { attributes: [] } },
      { model: Notification, as: 'notifications' }
    ]
  });
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.json({ success: true, data: user });
});

module.exports = {
  getAllUsers,
  getUserById
};
