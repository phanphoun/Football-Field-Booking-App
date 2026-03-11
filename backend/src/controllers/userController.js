const { Op } = require('sequelize');
const { User, Field, Booking, Team, Notification, TeamMember } = require('../models');
const bcrypt = require('bcryptjs');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'createdBookings' },
      { model: Team, as: 'teams', through: { attributes: [] } },
      { model: Notification, as: 'notifications' }
    ]
  });
  res.json({ success: true, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
    include: [
      { model: Field, as: 'fields' },
      { model: Booking, as: 'createdBookings' },
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
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || 'player'
    });
    
    const userJson = user.toJSON();
    delete userJson.password;

    res.status(201).json({ success: true, data: userJson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, firstName, lastName, phone, role, status } = req.body;
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
      role,
      status
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

// Search users by username or email (partial match)
const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Query parameter q is required' });
  }

  const role = req.query.role;
  const teamId = req.query.teamId ? Number(req.query.teamId) : null;

  const where = {
    [Op.or]: [
      { username: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } },
      { firstName: { [Op.like]: `%${q}%` } },
      { lastName: { [Op.like]: `%${q}%` } }
    ]
  };

  if (role) {
    where.role = role;
  }

  if (teamId) {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return res.status(400).json({ success: false, message: 'teamId must be a positive integer' });
    }

    const team = await Team.findByPk(teamId, { attributes: ['id', 'captainId'] });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCaptainOfTeam = team.captainId === req.user.id;
    if (!isAdmin && !isCaptainOfTeam) {
      return res.status(403).json({ success: false, message: 'Not authorized to search invite candidates for this team' });
    }

    const existingMembers = await TeamMember.findAll({
      where: {
        teamId,
        status: { [Op.in]: ['active', 'pending'] }
      },
      attributes: ['userId']
    });

    const blockedUserIds = Array.from(new Set([team.captainId, ...existingMembers.map((m) => m.userId)]));
    if (blockedUserIds.length > 0) {
      where.id = { [Op.notIn]: blockedUserIds };
    }
  }

  const users = await User.findAll({
    where,
    attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
    limit: 10
  });

  res.json({ success: true, data: users });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers
};
