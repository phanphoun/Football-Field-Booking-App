const { User, Team } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const serverConfig = require('../config/serverConfig');

const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const LEGACY_DEFAULT_AVATAR_PATH = '/uploads/profile/defualt_profile.jpg';

/**
 * Helper function to set authentication cookies with httpOnly flag
 * @param {Response} res - Express response object
 * @param {number} userId - User ID for token
 * @param {string} role - User role for token
 */
const setAuthCookie = (res, userId, role) => {
  const token = jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  // Set secure httpOnly cookie (prevents XSS attacks)
  res.cookie('token', token, {
    httpOnly: true,                                    // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production',   // Only HTTPS in production
    sameSite: 'strict',                              // CSRF protection
    maxAge: 60 * 60 * 1000,                          // 1 hour
    path: '/'
  });

  return token;
};

const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, role } = req.body;
    
    // Enhanced validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Please provide all required fields: username, email, password, firstName, lastName.' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Username validation
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    // Hash password with stronger salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: role || 'player'
    });

    // Set httpOnly cookie token (not returned in response)
    setAuthCookie(res, user.id, user.role);

    // Return user data without password or token
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({ 
      success: true,
      data: { user: userResponse },
      message: 'Registration successful'
    });
  } catch (error) {
    // Don't log full error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Registration error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password.' 
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active. Please contact support.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Set httpOnly cookie token (not returned in response)
    setAuthCookie(res, user.id, user.role);

    // Return user data without password or token
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({ 
      success: true,
      data: { user: userResponse },
      message: 'Login successful'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error.message);
    }
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { 
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ 
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error while fetching profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, firstName, lastName, phone, address, dateOfBirth, gender, avatarUrl } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update user with provided fields
    const updateData = {};
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
      updateData.email = email;
    }
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    await user.update(updateData);

    // Return updated user without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ 
      message: 'Profile updated successfully.', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
};

const uploadProfileAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const maxAvatarSize = serverConfig.upload.maxSize;
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const uploadDir = path.resolve(projectRoot, 'frontend', 'public', 'uploads', 'profile');
    fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
      destination: (innerReq, file, cb) => cb(null, uploadDir),
      filename: (innerReq, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `user_${userId}_${Date.now()}${ext}`);
      }
    });

    const upload = multer({
      storage,
      limits: { fileSize: maxAvatarSize },
      fileFilter: (innerReq, file, cb) => {
        const allowed = serverConfig.upload.allowedTypes;
        if (!allowed.includes(file.mimetype)) {
          return cb(new Error('Invalid file type'));
        }
        cb(null, true);
      }
    }).single('avatar');

    upload(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = Math.round(maxAvatarSize / (1024 * 1024));
          return res.status(400).json({ error: `Avatar image must be ${maxMb}MB or smaller` });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        if (
          user.avatarUrl &&
          typeof user.avatarUrl === 'string' &&
          user.avatarUrl.startsWith('/uploads/') &&
          user.avatarUrl !== DEFAULT_AVATAR_PATH &&
          user.avatarUrl !== LEGACY_DEFAULT_AVATAR_PATH
        ) {
          const previousPath = user.avatarUrl.replace(/^\//, '');
          let previousAbsolutePath = null;

          if (user.avatarUrl.startsWith('/uploads/profile/')) {
            previousAbsolutePath = path.resolve(projectRoot, 'frontend', 'public', previousPath);
          } else {
            previousAbsolutePath = path.resolve(__dirname, '..', '..', previousPath);
          }

          if (fs.existsSync(previousAbsolutePath)) {
            fs.unlinkSync(previousAbsolutePath);
          }
        }
      } catch (unlinkError) {
        // Ignore unlink errors
      }

      const avatarUrl = `/uploads/profile/${req.file.filename}`;
      await user.update({ avatarUrl });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        avatarUrl: user.avatarUrl,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        message: 'Avatar uploaded successfully.',
        avatarUrl,
        user: userResponse
      });
    });
  } catch (error) {
    console.error('Upload profile avatar error:', error);
    res.status(500).json({ error: 'Internal server error while uploading avatar.' });
  }
};

const deleteProfileAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    try {
      if (
        user.avatarUrl &&
        typeof user.avatarUrl === 'string' &&
        user.avatarUrl.startsWith('/uploads/') &&
        user.avatarUrl !== DEFAULT_AVATAR_PATH &&
        user.avatarUrl !== LEGACY_DEFAULT_AVATAR_PATH
      ) {
        const previousPath = user.avatarUrl.replace(/^\//, '');
        let previousAbsolutePath = null;

        if (user.avatarUrl.startsWith('/uploads/profile/')) {
          previousAbsolutePath = path.resolve(projectRoot, 'frontend', 'public', previousPath);
        } else {
          previousAbsolutePath = path.resolve(__dirname, '..', '..', previousPath);
        }

        if (fs.existsSync(previousAbsolutePath)) {
          fs.unlinkSync(previousAbsolutePath);
        }
      }
    } catch (unlinkError) {
      // Ignore unlink errors
    }

    await user.update({ avatarUrl: null });

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      message: 'Avatar removed successfully.',
      user: userResponse
    });
  } catch (error) {
    console.error('Delete profile avatar error:', error);
    res.status(500).json({ error: 'Internal server error while deleting avatar.' });
  }
};

const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error during logout' });
  }
};

const refreshToken = async (req, res) => {
  try {
    // Token is in the cookie, middleware has already validated it
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new token
    setAuthCookie(res, user.id, user.role);

    // Return updated user
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    res.json({
      success: true,
      data: { user: userResponse },
      message: 'Token refreshed'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error refreshing token' });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  deleteProfileAvatar
};
