const { User, Field, Booking, Team, Notification, TeamMember, MatchResult } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

const toDiskPathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) return null;

  const relativePath = String(publicUrl).replace(/^\/+/, '');
  const resolved = path.resolve(process.cwd(), relativePath);
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');

  // Prevent path traversal / accidental deletes outside uploads/
  if (resolved !== uploadsRoot && !resolved.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }

  return resolved;
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true });
    }
    cb(null, AVATARS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      const oldAvatarPath = toDiskPathFromPublicUrl(user.avatarUrl);
      if (oldAvatarPath && fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      data: userResponse 
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(AVATARS_DIR, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

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
      role: role || 'player',
      avatarUrl: '/uploads/avatars/default-avatar.jpg'
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

// Get profile data with role-specific information
const getProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Team,
          as: 'teams',
          through: { attributes: ['role', 'joinedAt'] },
          include: [
            {
              model: TeamMember,
              as: 'teamMembers',
              include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'username'] }]
            }
          ]
        },
        {
          model: Team,
          as: 'captainedTeams',
          include: [
            {
              model: TeamMember,
              as: 'teamMembers',
              include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'username'] }]
            }
          ]
        },
        {
          model: Field,
          as: 'fields',
          include: [
            {
              model: Booking,
              as: 'bookings',
              limit: 5,
              order: [['createdAt', 'DESC']]
            }
          ]
        },
        {
          model: Booking,
          as: 'createdBookings',
          include: [
            { model: Field, as: 'field', attributes: ['id', 'name', 'address'] },
            { model: Team, as: 'team', attributes: ['id', 'name'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 10
        },
        {
          model: MatchResult,
          as: 'mvpMatches',
          include: [
            { model: Team, as: 'homeTeam', attributes: ['id', 'name'] },
            { model: Team, as: 'awayTeam', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate role-specific statistics
    let stats = {
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      totalTeams: 0,
      captainedTeams: 0,
      mvpAwards: 0,
      fieldsOwned: 0,
      memberSince: user.createdAt,
      lastLogin: user.lastLogin
    };

    // Calculate booking statistics
    if (user.createdBookings) {
      stats.totalBookings = user.createdBookings.length;
      stats.upcomingBookings = user.createdBookings.filter(booking => 
        booking.startTime > new Date()
      ).length;
      stats.completedBookings = user.createdBookings.filter(booking => 
        booking.endTime <= new Date()
      ).length;
    }

    // Calculate team statistics
    if (user.teams) {
      stats.totalTeams = user.teams.length;
    }
    if (user.captainedTeams) {
      stats.captainedTeams = user.captainedTeams.length;
    }

    // Calculate MVP awards
    if (user.mvpMatches) {
      stats.mvpAwards = user.mvpMatches.length;
    }

    // Calculate fields owned for field owners
    if (user.fields) {
      stats.fieldsOwned = user.fields.length;
    }

    res.json({ 
      success: true, 
      data: {
        user,
        stats,
        roleSpecific: {
          isPlayer: user.role === 'player',
          isCaptain: user.role === 'captain',
          isFieldOwner: user.role === 'field_owner',
          isAdmin: user.role === 'admin'
        }
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update profile with enhanced functionality
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      username,
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      dateOfBirth, 
      gender,
      currentPassword,
      newPassword 
    } = req.body;

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prepare update data
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;

    // Handle password change if requested
    if (currentPassword && newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      }
      
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    await user.update(updateData);
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({ success: true, data: userResponse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  uploadAvatar,
  upload
};
