const { TeamMember, Team, User } = require('../models');

// ========================================
// TEAM MEMBER HELPER FUNCTIONS
// ========================================

/**
 * Async handler wrapper for error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Build search filter for team members based on query parameters
 */
const buildTeamMemberFilter = (query) => {
  const { teamId, userId, status, isActive } = query;
  const whereClause = {};
  
  if (teamId) whereClause.teamId = teamId;
  if (userId) whereClause.userId = userId;
  if (status) whereClause.status = status;
  if (isActive !== undefined) whereClause.isActive = isActive === 'true';
  
  return whereClause;
};

/**
 * Check if user is authorized to manage team membership
 */
const checkTeamMemberAuthorization = async (teamMember, user) => {
  const isMember = teamMember.userId === user.id;
  const isCaptain = teamMember.team?.captainId === user.id;
  const isAdmin = user.role === 'admin';
  
  return { isMember, isCaptain, isAdmin, isAuthorized: isMember || isCaptain || isAdmin };
};

/**
 * Validate team member data for creation/update
 */
const validateTeamMemberData = (data) => {
  const errors = [];
  
  // Validate required fields
  if (!data.teamId) {
    errors.push('Team ID is required');
  }
  
  if (!data.userId) {
    errors.push('User ID is required');
  }
  
  // Validate role
  if (data.role && !['captain', 'player', 'manager', 'substitute'].includes(data.role)) {
    errors.push('Invalid role. Must be one of: captain, player, manager, substitute');
  }
  
  // Validate status
  if (data.status && !['pending', 'active', 'inactive', 'rejected'].includes(data.status)) {
    errors.push('Invalid status. Must be one of: pending, active, inactive, rejected');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Format team member data for response
 */
const formatTeamMemberData = (teamMember) => {
  const memberData = teamMember.toJSON ? teamMember.toJSON() : teamMember;
  
  return {
    id: memberData.id,
    teamId: memberData.teamId,
    userId: memberData.userId,
    role: memberData.role,
    status: memberData.status,
    isActive: memberData.isActive,
    joinedAt: memberData.joinedAt,
    createdAt: memberData.createdAt,
    updatedAt: memberData.updatedAt,
    
    // Include user info if available
    user: memberData.user ? {
      id: memberData.user.id,
      username: memberData.user.username,
      firstName: memberData.user.firstName,
      lastName: memberData.user.lastName,
      email: memberData.user.email,
      phone: memberData.user.phone
    } : null,
    
    // Include team info if available
    team: memberData.team ? {
      id: memberData.team.id,
      name: memberData.team.name,
      skillLevel: memberData.team.skillLevel,
      captainId: memberData.team.captainId
    } : null
  };
};

// ========================================
// TEAM MEMBER CONTROLLERS
// ========================================

/**
 * GET /api/team-members
 * Get team members with optional filtering
 * Supports filtering by team ID, user ID, status, and active status
 */
const getAllTeamMembers = asyncHandler(async (req, res) => {
  try {
    console.log('getAllTeamMembers called');
    console.log('Query params:', req.query);
    
    // ========================================
    // BUILD SEARCH FILTER
    // ========================================
    
    const whereClause = buildTeamMemberFilter(req.query);
    console.log('Where clause:', whereClause);

    // ========================================
    // FETCH TEAM MEMBERS WITH RELATIONS
    // ========================================

    console.log('About to query TeamMember...');
    const teamMembers = await TeamMember.findAll({
      where: whereClause,
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'skillLevel', 'captainId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('TeamMember query successful, count:', teamMembers.length);
    
    // ========================================
    // FORMAT TEAM MEMBER DATA
    // ========================================
    
    const formattedMembers = teamMembers.map(formatTeamMemberData);
    
    res.json({ success: true, data: formattedMembers });

  } catch (error) {
    console.error('Get all team members error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message
    });
  }
});

/**
 * GET /api/team-members/:id
 * Get a specific team member by ID
 * Requires authorization (member, captain, or admin)
 */
const getTeamMemberById = asyncHandler(async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // ========================================
    // FETCH TEAM MEMBER WITH RELATIONS
    // ========================================
    
    const teamMember = await TeamMember.findByPk(memberId, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'skillLevel', 'captainId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
    
    if (!teamMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team member not found' 
      });
    }
    
    // ========================================
    // CHECK AUTHORIZATION
    // ========================================
    
    const { isAuthorized } = await checkTeamMemberAuthorization(teamMember, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this team member' 
      });
    }
    
    // ========================================
    // FORMAT TEAM MEMBER DATA
    // ========================================
    
    const formattedMember = formatTeamMemberData(teamMember);
    
    res.json({ success: true, data: formattedMember });

  } catch (error) {
    console.error('Get team member by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team member',
      error: error.message
    });
  }
});

/**
 * PUT /api/team-members/:id
 * Update a team member request
 * Only team captains or admins can update member requests
 */
const updateTeamMember = asyncHandler(async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // ========================================
    // FETCH TEAM MEMBER
    // ========================================
    
    const teamMember = await TeamMember.findByPk(memberId);
    
    if (!teamMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team member not found' 
      });
    }
    
    // ========================================
    // CHECK AUTHORIZATION
    // ========================================
    
    const { isAuthorized } = await checkTeamMemberAuthorization(teamMember, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this team member' 
      });
    }
    
    // ========================================
    // VALIDATE UPDATE DATA
    // ========================================
    
    const { isValid, errors } = validateTeamMemberData(req.body);
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    // ========================================
    // UPDATE TEAM MEMBER
    // ========================================
    
    const updatedMember = await teamMember.update(req.body);
    
    // ========================================
    // FETCH UPDATED TEAM MEMBER WITH RELATIONS
    // ========================================
    
    const updatedMemberWithRelations = await TeamMember.findByPk(memberId, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'skillLevel', 'captainId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
    
    // ========================================
    // FORMAT TEAM MEMBER DATA
    // ========================================
    
    const formattedMember = formatTeamMemberData(updatedMemberWithRelations);
    
    res.json({ success: true, data: formattedMember });

  } catch (error) {
    console.error('Update team member error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update team member', 
      error: error.message 
    });
  }
});

/**
 * POST /api/team-members
 * Create a new team member request
 * Only team captains or admins can create member requests
 */
const createTeamMember = asyncHandler(async (req, res) => {
  try {
    // ========================================
    // VALIDATE CREATE DATA
    // ========================================
    
    const { isValid, errors } = validateTeamMemberData(req.body);
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    // ========================================
    // CREATE TEAM MEMBER
    // ========================================
    
    const teamMember = await TeamMember.create(req.body);
    
    // ========================================
    // FETCH CREATED TEAM MEMBER WITH RELATIONS
    // ========================================
    
    const createdMemberWithRelations = await TeamMember.findByPk(teamMember.id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'skillLevel', 'captainId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
    
    // ========================================
    // FORMAT TEAM MEMBER DATA
    // ========================================
    
    const formattedMember = formatTeamMemberData(createdMemberWithRelations);
    
    res.json({ success: true, data: formattedMember });

  } catch (error) {
    console.error('Create team member error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create team member', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/team-members/:id
 * Delete a team member request
 * Only team captains or admins can delete member requests
 */
const deleteTeamMember = asyncHandler(async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // ========================================
    // FETCH TEAM MEMBER
    // ========================================
    
    const teamMember = await TeamMember.findByPk(memberId);
    
    if (!teamMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team member not found' 
      });
    }
    
    // ========================================
    // CHECK AUTHORIZATION
    // ========================================
    
    const { isAuthorized } = await checkTeamMemberAuthorization(teamMember, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this team member' 
      });
    }
    
    // ========================================
    // DELETE TEAM MEMBER
    // ========================================
    
    await teamMember.destroy();
    
    res.json({ success: true, message: 'Team member deleted successfully' });

  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to delete team member', 
      error: error.message 
    });
  }
});

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
