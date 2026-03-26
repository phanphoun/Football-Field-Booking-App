const { User, Team } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createInAppNotification } = require('../utils/notify');

/**
 * Authentication Service
 * Handles all authentication business logic
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { username, email, password, firstName, lastName, phone, role } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      isActive: true
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    return userWithoutPassword;
    
  }
  
  /**
   * Login user
   */
  async login(email, password, ip) {
    // Find user
    /** @type {import('sequelize').FindOptions<typeof User>} */
    const findOptions = {
      where: { email, isActive: true },
      include: [
        {
          model: Team,
          as: 'captainedTeams',
          attributes: ['id', 'name']
        }
      ]
    };
    const user = await User.findOne(findOptions);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    return {
      token,
      user: userWithoutPassword
    };
  }
  
  /**
   * Get user profile
   */
  async getProfile(userId) {
    /** @type {import('sequelize').FindOptions<typeof User>} */
    const findOptions = {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Team,
          as: 'captainedTeams',
          attributes: ['id', 'name', 'skillLevel']
        }
      ]
    };
    const user = await User.findByPk(userId, findOptions);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    await user.update(updateData);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    return userWithoutPassword;
  }
  
  /**
   * Request field owner role
   */
  async requestFieldOwnerRole(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role === 'field_owner') {
      throw new Error('You already have field owner access');
    }
    
    // Find admins to notify
    const admins = await User.findAll({ 
      where: { role: 'admin' }, 
      attributes: ['id'] 
    });
    
    if (admins.length === 0) {
      throw new Error('No admin found to process this request');
    }
    
    // Send notifications to admins
    const notifications = admins.map(admin => ({
      userId: admin.id,
      type: 'system',
      title: 'Field owner role request',
      message: `${user.firstName || user.username} requested to become a field owner.`,
      metadata: {
        requestType: 'field_owner_upgrade',
        requesterId: user.id,
        requesterEmail: user.email,
        requesterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        status: 'pending'
      }
    }));
    
    try {
      await Promise.all(
        notifications.map(notification => createInAppNotification(notification))
      );
    } catch (error) {
      console.warn('Failed to send admin notifications:', error.message);
    }
    
    return { requested: true };
  }
  
  /**
   * Get public profile
   */
  async getPublicProfile(userId) {
    /** @type {import('sequelize').FindOptions<typeof User>} */
    const findOptions = {
      attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
      include: [
        {
          model: Team,
          as: 'captainedTeams',
          attributes: ['id', 'name', 'skillLevel', 'isActive'],
          required: false
        }
      ]
    };
    const user = await User.findByPk(userId, findOptions);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      captainedTeams: user.captainedTeams || [],
      teamCount: user.captainedTeams ? user.captainedTeams.length : 0
    };
  }
}

module.exports = new AuthService();
