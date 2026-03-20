const { User, RoleRequest } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Magic number signatures for common image formats
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]]
};

// Validate file signature before continuing.
const validateFileSignature = (buffer, mimetype) => {
  const signatures = FILE_SIGNATURES[mimetype];
  if (!signatures) return false;
  return signatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte);
  });
};
const serverConfig = require('../config/serverConfig');
const { createInAppNotification } = require('../utils/notify');

const DEFAULT_AVATAR_PATH = '/uploads/profile/default_profile.jpg';
const LEGACY_DEFAULT_AVATAR_PATH = '/uploads/profile/defualt_profile.jpg';
const REQUESTABLE_ROLES_BY_USER_ROLE = {
  player: ['captain', 'field_owner'],
  captain: ['field_owner']
};

const ROLE_REQUEST_LABELS = {
  captain: 'captain',
  field_owner: 'field owner'
};

// Serialize role request for API responses.
const serializeRoleRequest = (roleRequest) => ({
  id: roleRequest.id,
  requestedRole: roleRequest.requestedRole,
  status: roleRequest.status,
  note: roleRequest.note || '',
  reviewedBy: roleRequest.reviewedBy,
  reviewedAt: roleRequest.reviewedAt,
  createdAt: roleRequest.createdAt,
  updatedAt: roleRequest.updatedAt
});

// Get allowed requested roles for the current flow.
const getAllowedRequestedRoles = (currentRole) => REQUESTABLE_ROLES_BY_USER_ROLE[currentRole] || [];

// Support register for this module.
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

    // Check if user exists (prevent user enumeration with generic message)
    const existingUser = await User.findOne({ where: { email } });
    const existingUsername = await User.findOne({ where: { username } });

    if (existingUser || existingUsername) {
      return res.status(400).json({ error: 'Email or username already in use.' });
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
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user data without password
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

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// Support login for this module.
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
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user data without password
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

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

// Get profile for the current flow.
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

// Update profile in local state.
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
      updateData.email = String(email).trim();
    }
    if (firstName !== undefined) updateData.firstName = String(firstName).trim();
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) updateData.address = address ? String(address).trim() : null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (updateData.firstName !== undefined && !updateData.firstName) {
      return res.status(400).json({ error: 'First name is required.' });
    }

    if (updateData.lastName !== undefined && !updateData.lastName) {
      return res.status(400).json({ error: 'Last name is required.' });
    }

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
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const message = error.errors?.[0]?.message || 'Invalid profile data.';
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
};

// Support change password for this module.
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error while changing password.' });
  }
};

// Support upload profile avatar for this module.
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
        if (!serverConfig.isAllowedImageUpload(file)) {
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

      // Validate file signature to prevent malicious uploads
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const isValid = validateFileSignature(fileBuffer.slice(0, 10), req.file.mimetype);

        if (!isValid) {
          // Delete the invalid file
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            error: 'File content does not match the declared type. Upload rejected for security reasons.'
          });
        }
      } catch (validationError) {
        console.error('File signature validation error:', validationError);
        try {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to cleanup invalid file:', cleanupError);
        }
        return res.status(500).json({ error: 'File validation failed' });
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

// Support delete profile avatar for this module.
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

// Get role requests for the current flow.
const getRoleRequests = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const requests = await RoleRequest.findAll({
      where: { requesterId: user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      currentRole: user.role,
      availableRoles: getAllowedRequestedRoles(user.role),
      hasPendingRequest: requests.some((request) => request.status === 'pending'),
      requests: requests.map(serializeRoleRequest)
    });
  } catch (error) {
    console.error('Get role requests error:', error);
    res.status(500).json({ error: 'Internal server error while fetching role requests.' });
  }
};

// Request role upgrade from the API.
const requestRoleUpgrade = async (req, res) => {
  try {
    const { requestedRole, note } = req.body;
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'firstName', 'lastName', 'role']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const allowedRoles = getAllowedRequestedRoles(user.role);
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        error: 'Your current account cannot request that role.'
      });
    }

    const existingPendingRequest = await RoleRequest.findOne({
      where: {
        requesterId: user.id,
        status: 'pending'
      }
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        error: `You already have a pending request to become a ${ROLE_REQUEST_LABELS[existingPendingRequest.requestedRole]}.`
      });
    }

    const roleRequest = await RoleRequest.create({
      requesterId: user.id,
      requestedRole,
      note: note?.trim() || null
    });

    const admins = await User.findAll({
      where: { role: 'admin', status: 'active' },
      attributes: ['id']
    });

    if (admins.length > 0) {
      const requesterName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

      await Promise.allSettled(
        admins.map((admin) =>
          createInAppNotification({
            userId: admin.id,
            type: 'system',
            title: `${requestedRole === 'captain' ? 'Captain' : 'Field owner'} role request`,
            message: `${requesterName} requested ${ROLE_REQUEST_LABELS[requestedRole]} access.`,
            metadata: {
              event: 'role_request',
              requestId: roleRequest.id,
              requesterId: user.id,
              requestedRole,
              status: 'pending'
            }
          })
        )
      );
    }

    res.status(201).json({
      message: `Your ${ROLE_REQUEST_LABELS[requestedRole]} request has been submitted.`,
      roleRequest: serializeRoleRequest(roleRequest)
    });
  } catch (error) {
    console.error('Request role upgrade error:', error);
    res.status(500).json({ error: 'Internal server error while submitting role request.' });
  }
};

// Check whether cel role request is allowed.
const cancelRoleRequest = async (req, res) => {
  try {
    const requestId = Number(req.params.id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'username', 'firstName', 'lastName']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const roleRequest = await RoleRequest.findOne({
      where: {
        id: requestId,
        requesterId: user.id
      }
    });

    if (!roleRequest) {
      return res.status(404).json({ error: 'Role request not found.' });
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending role requests can be deleted.' });
    }

    const requestedRole = roleRequest.requestedRole;

    await roleRequest.destroy();

    const admins = await User.findAll({
      where: { role: 'admin', status: 'active' },
      attributes: ['id']
    });

    if (admins.length > 0) {
      const requesterName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

      await Promise.allSettled(
        admins.map((admin) =>
          createInAppNotification({
            userId: admin.id,
            type: 'system',
            title: `${requestedRole === 'captain' ? 'Captain' : 'Field owner'} role request cancelled`,
            message: `${requesterName} deleted their ${ROLE_REQUEST_LABELS[requestedRole]} request.`,
            metadata: {
              event: 'role_request_cancelled',
              requestId,
              requesterId: user.id,
              requestedRole,
              status: 'cancelled'
            }
          })
        )
      );
    }

    res.json({
      message: `Your ${ROLE_REQUEST_LABELS[requestedRole]} request has been deleted.`
    });
  } catch (error) {
    console.error('Cancel role request error:', error);
    res.status(500).json({ error: 'Internal server error while deleting role request.' });
  }
};

// Get all role requests for admin for the current flow.
const getAllRoleRequestsForAdmin = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const where = {};
    if (['pending', 'approved', 'rejected'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const requests = await RoleRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'status', 'phone', 'address', 'dateOfBirth', 'avatarUrl']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get all role requests for admin error:', error);
    res.status(500).json({ error: 'Internal server error while fetching role requests.' });
  }
};

// Support review role request for this module.
const reviewRoleRequest = async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const { action, note } = req.body;

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or reject.' });
    }

    const roleRequest = await RoleRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role']
        }
      ]
    });

    if (!roleRequest) {
      return res.status(404).json({ error: 'Role request not found.' });
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ error: 'This role request has already been reviewed.' });
    }

    const isApproved = action === 'approve';
    roleRequest.status = isApproved ? 'approved' : 'rejected';
    roleRequest.reviewedBy = req.user.id;
    roleRequest.reviewedAt = new Date();
    roleRequest.note = note?.trim() ? note.trim() : roleRequest.note;
    await roleRequest.save();

    if (isApproved && roleRequest.requester) {
      await roleRequest.requester.update({ role: roleRequest.requestedRole });
    }

    if (roleRequest.requester?.id) {
      await createInAppNotification({
        userId: roleRequest.requester.id,
        type: 'system',
        title: `${roleRequest.requestedRole === 'captain' ? 'Captain' : 'Field owner'} role request ${isApproved ? 'approved' : 'rejected'}`,
        message: isApproved
          ? `Your request for ${ROLE_REQUEST_LABELS[roleRequest.requestedRole]} access was approved.`
          : `Your request for ${ROLE_REQUEST_LABELS[roleRequest.requestedRole]} access was rejected.`,
        metadata: {
          event: 'role_request_reviewed',
          requestId: roleRequest.id,
          requestedRole: roleRequest.requestedRole,
          status: roleRequest.status
        }
      });
    }

    res.json({
      message: `Role request ${isApproved ? 'approved' : 'rejected'} successfully.`,
      roleRequest: serializeRoleRequest(roleRequest)
    });
  } catch (error) {
    console.error('Review role request error:', error);
    res.status(500).json({ error: 'Internal server error while reviewing role request.' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getRoleRequests,
  requestRoleUpgrade,
  cancelRoleRequest,
  getAllRoleRequestsForAdmin,
  reviewRoleRequest,
  uploadProfileAvatar,
  deleteProfileAvatar
};
