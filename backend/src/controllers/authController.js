const { User, Team } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const serverConfig = require('../config/serverConfig');

const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const LEGACY_DEFAULT_AVATAR_PATH = '/uploads/profile/defualt_profile.jpg';

const sanitizeUsername = (value = '') => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return cleaned.slice(0, 30);
};

const buildUniqueGoogleUsername = async (email, fullName = '') => {
  const emailPrefix = email?.split('@')?.[0] || '';
  const namePrefix = fullName
    .split(' ')
    .filter(Boolean)
    .join('_');

  const candidateBase =
    sanitizeUsername(namePrefix) ||
    sanitizeUsername(emailPrefix) ||
    `user${Date.now()}`;

  let candidate = candidateBase.slice(0, 30);
  let counter = 0;

  while (true) {
    const existingUser = await User.findOne({ where: { username: candidate } });
    if (!existingUser) {
      return candidate;
    }

    counter += 1;
    const suffix = `_${counter}`;
    const maxBaseLength = 30 - suffix.length;
    candidate = `${candidateBase.slice(0, Math.max(3, maxBaseLength))}${suffix}`;
  }
};

const issueAuthToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const toUserResponse = (user) => ({
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
});

const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
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

    // Generate token
    const token = issueAuthToken(user);

    // Return user data without password
    const userResponse = toUserResponse(user);

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
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
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(400).json({ error: 'Account is not active. Please contact support.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = issueAuthToken(user);

    // Return user data without password
    const userResponse = toUserResponse(user);

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body || {};
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    if (!googleClientId) {
      return res.status(500).json({ error: 'Google login is not configured on the server.' });
    }

    const tokenInfoResponse = await axios.get(
      'https://oauth2.googleapis.com/tokeninfo',
      {
        params: { id_token: idToken },
        timeout: 10000
      }
    );

    const tokenInfo = tokenInfoResponse.data || {};
    const issuer = tokenInfo.iss;
    const isIssuerValid =
      issuer === 'accounts.google.com' ||
      issuer === 'https://accounts.google.com';
    const isAudienceValid = tokenInfo.aud === googleClientId;
    const isEmailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;

    if (!isIssuerValid || !isAudienceValid || !isEmailVerified || !tokenInfo.email) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const email = tokenInfo.email.toLowerCase();
    const fullName = tokenInfo.name || '';
    const nameParts = fullName.split(' ').filter(Boolean);
    const firstName = tokenInfo.given_name || nameParts[0] || 'Google';
    const lastName =
      tokenInfo.family_name ||
      nameParts.slice(1).join(' ') ||
      'User';

    let user = await User.findOne({ where: { email } });

    if (!user) {
      const username = await buildUniqueGoogleUsername(email, fullName);
      const randomPassword = `${tokenInfo.sub || 'google'}_${Date.now()}_${Math.random()}`;
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'player',
        status: 'active',
        emailVerified: true
      });
    } else if (user.status !== 'active') {
      return res.status(400).json({ error: 'Account is not active. Please contact support.' });
    }

    await user.update({ lastLogin: new Date(), emailVerified: true });
    const token = issueAuthToken(user);

    return res.json({
      user: toUserResponse(user),
      token
    });
  } catch (error) {
    const status = error.response?.status;
    const googleError = error.response?.data?.error_description || error.response?.data?.error;
    if (status === 400 || status === 401) {
      return res.status(401).json({ error: googleError || 'Invalid Google token.' });
    }

    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Internal server error during Google login.' });
  }
};

const loginWithFacebook = async (req, res) => {
  try {
    const { accessToken, userId } = req.body || {};
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!accessToken || !userId) {
      return res.status(400).json({ error: 'Facebook access token and userId are required.' });
    }

    if (!appId || !appSecret) {
      return res.status(500).json({ error: 'Facebook login is not configured on the server.' });
    }

    const appAccessToken = `${appId}|${appSecret}`;
    const debugResponse = await axios.get(
      'https://graph.facebook.com/debug_token',
      {
        params: {
          input_token: accessToken,
          access_token: appAccessToken
        },
        timeout: 10000
      }
    );

    const debugData = debugResponse.data?.data || {};
    const isValid =
      debugData.is_valid === true &&
      String(debugData.user_id) === String(userId) &&
      String(debugData.app_id) === String(appId);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Facebook token.' });
    }

    const profileResponse = await axios.get(
      `https://graph.facebook.com/${userId}`,
      {
        params: {
          fields: 'id,name,first_name,last_name,email',
          access_token: accessToken
        },
        timeout: 10000
      }
    );

    const profile = profileResponse.data || {};
    if (!profile.id || !profile.email) {
      return res.status(400).json({
        error: 'Facebook account did not provide an email. Please use email login or Google login.'
      });
    }

    const email = String(profile.email).toLowerCase();
    let user = await User.findOne({ where: { email } });

    if (!user) {
      const username = await buildUniqueGoogleUsername(email, profile.name || '');
      const randomPassword = `facebook_${profile.id}_${Date.now()}_${Math.random()}`;
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName: profile.first_name || 'Facebook',
        lastName: profile.last_name || 'User',
        role: 'player',
        status: 'active',
        emailVerified: true
      });
    } else if (user.status !== 'active') {
      return res.status(400).json({ error: 'Account is not active. Please contact support.' });
    }

    await user.update({ lastLogin: new Date(), emailVerified: true });
    const token = issueAuthToken(user);

    return res.json({
      user: toUserResponse(user),
      token
    });
  } catch (error) {
    const status = error.response?.status;
    const facebookError = error.response?.data?.error?.message;
    if (status === 400 || status === 401) {
      return res.status(401).json({ error: facebookError || 'Invalid Facebook token.' });
    }

    console.error('Facebook login error:', error);
    return res.status(500).json({ error: 'Internal server error during Facebook login.' });
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

    res.json(user);
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

module.exports = {
  register,
  login,
  loginWithGoogle,
  loginWithFacebook,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  deleteProfileAvatar
};
