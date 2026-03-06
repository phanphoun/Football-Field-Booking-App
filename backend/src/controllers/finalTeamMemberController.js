const { TeamMember, Team, User } = require('../models');

/**
 * GET /api/team-members
 * Get team members with optional filtering
 * Working version with Promise-based approach
 */
const getAllTeamMembers = (req, res) => {
  console.log('Final Team Members Controller called');
  
  TeamMember.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name', 'skillLevel', 'captainId'],
        required: false
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone'],
        required: false
      }
    ]
  })
  .then(teamMembers => {
    console.log('TeamMember query successful, count:', teamMembers.length);
    
    const formattedMembers = teamMembers.map(member => {
      const memberData = member.get ? member.get({ plain: true }) : member.dataValues;
      
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
        
        // Include related data if available
        team: memberData.team ? {
          id: memberData.team.id,
          name: memberData.team.name,
          skillLevel: memberData.team.skillLevel,
          captainId: memberData.team.captainId
        } : null,
        
        user: memberData.user ? {
          id: memberData.user.id,
          username: memberData.user.username,
          firstName: memberData.user.firstName,
          lastName: memberData.user.lastName,
          email: memberData.user.email,
          phone: memberData.user.phone
        } : null
      };
    });
    
    console.log('Formatting successful, formatted count:', formattedMembers.length);
    
    res.json({ 
      success: true, 
      data: formattedMembers 
    });
  })
  .catch(error => {
    console.error('Get all team members error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message
    });
  });
};

/**
 * GET /api/team-members/:id
 * Get team member by ID
 */
const getTeamMemberById = (req, res) => {
  const { id } = req.params;
  
  TeamMember.findByPk(id, {
    include: [
      {
        model: Team,
        as: 'team',
        attributes: ['id', 'name', 'skillLevel', 'captainId'],
        required: false
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'phone'],
        required: false
      }
    ]
  })
  .then(teamMember => {
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    const memberData = teamMember.get ? teamMember.get({ plain: true }) : teamMember.dataValues;
    
    res.json({
      success: true,
      data: {
        id: memberData.id,
        teamId: memberData.teamId,
        userId: memberData.userId,
        role: memberData.role,
        status: memberData.status,
        isActive: memberData.isActive,
        joinedAt: memberData.joinedAt,
        createdAt: memberData.createdAt,
        updatedAt: memberData.updatedAt,
        
        team: memberData.team ? {
          id: memberData.team.id,
          name: memberData.team.name,
          skillLevel: memberData.team.skillLevel,
          captainId: memberData.team.captainId
        } : null,
        
        user: memberData.user ? {
          id: memberData.user.id,
          username: memberData.user.username,
          firstName: memberData.user.firstName,
          lastName: memberData.user.lastName,
          email: memberData.user.email,
          phone: memberData.user.phone
        } : null
      }
    });
  })
  .catch(error => {
    console.error('Get team member by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team member',
      error: error.message
    });
  });
};

/**
 * POST /api/team-members
 * Create team member (captain/admin only)
 */
const createTeamMember = (req, res) => {
  const { teamId, userId, role } = req.body;
  
  if (!teamId || !userId || !role) {
    return res.status(400).json({
      success: false,
      message: 'teamId, userId, and role are required'
    });
  }
  
  TeamMember.create({
    teamId,
    userId,
    role,
    status: 'active',
    isActive: true
  })
  .then(teamMember => {
    res.status(201).json({
      success: true,
      data: teamMember,
      message: 'Team member created successfully'
    });
  })
  .catch(error => {
    console.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team member',
      error: error.message
    });
  });
};

/**
 * PUT /api/team-members/:id
 * Update team member (captain/admin only)
 */
const updateTeamMember = (req, res) => {
  const { id } = req.params;
  const { role, status, isActive } = req.body;
  
  TeamMember.findByPk(id)
    .then(teamMember => {
      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }
      
      return teamMember.update({
        role: role || teamMember.role,
        status: status || teamMember.status,
        isActive: isActive !== undefined ? isActive : teamMember.isActive
      });
    })
    .then(updatedTeamMember => {
      res.json({
        success: true,
        data: updatedTeamMember,
        message: 'Team member updated successfully'
      });
    })
    .catch(error => {
      console.error('Update team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team member',
        error: error.message
      });
    });
};

/**
 * DELETE /api/team-members/:id
 * Delete team member (captain/admin only)
 */
const deleteTeamMember = (req, res) => {
  const { id } = req.params;
  
  TeamMember.findByPk(id)
    .then(teamMember => {
      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }
      
      return teamMember.destroy();
    })
    .then(() => {
      res.json({
        success: true,
        message: 'Team member deleted successfully'
      });
    })
    .catch(error => {
      console.error('Delete team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete team member',
        error: error.message
      });
    });
};

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
