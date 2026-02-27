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

const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, role } = req.body;
    
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'player'
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, firstName, lastName, phone, role } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Authorization check
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }
    
    await user.update({
      username,
      email,
      firstName,
      lastName,
      phone,
      role
    });
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Authorization check
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
    }
    
    await user.destroy();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
