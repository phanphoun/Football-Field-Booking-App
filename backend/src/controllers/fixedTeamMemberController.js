const { TeamMember, Team, User } = require('../models');

/**
 * GET /api/team-members
 * Get team members with optional filtering
 */
// Get all team members for the current flow.
const getAllTeamMembers = async (req, res) => {
  try {
    console.log('getAllTeamMembers called successfully');
    
    // Simple query without complex filtering
    const teamMembers = await TeamMember.findAll({
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
    
    // Simple formatting
    const formattedMembers = teamMembers.map(member => {
      const memberData = member.toJSON ? member.toJSON() : member;
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
        user: memberData.user || null,
        team: memberData.team || null
      };
    });
    
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
};

/**
 * GET /api/team-members/:id
 * Get team member by ID
 */
// Get team member by id for the current flow.
const getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const teamMember = await TeamMember.findByPk(id, {
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
    
    const memberData = teamMember.toJSON ? teamMember.toJSON() : teamMember;
    
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
        user: memberData.user || null,
        team: memberData.team || null
      }
    });

  } catch (error) {
    console.error('Get team member by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team member',
      error: error.message
    });
  }
};

/**
 * POST /api/team-members
 * Create team member (captain/admin only)
 */
// Create team member for the current flow.
const createTeamMember = async (req, res) => {
  try {
    const { teamId, userId, role } = req.body;
    
    if (!teamId || !userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'teamId, userId, and role are required'
      });
    }
    
    const teamMember = await TeamMember.create({
      teamId,
      userId,
      role,
      status: 'active',
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      data: teamMember,
      message: 'Team member created successfully'
    });

  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team member',
      error: error.message
    });
  }
};

/**
 * PUT /api/team-members/:id
 * Update team member (captain/admin only)
 */
// Update team member in local state.
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, isActive } = req.body;
    
    const teamMember = await TeamMember.findByPk(id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    await teamMember.update({
      role: role || teamMember.role,
      status: status || teamMember.status,
      isActive: isActive !== undefined ? isActive : teamMember.isActive
    });
    
    res.json({
      success: true,
      data: teamMember,
      message: 'Team member updated successfully'
    });

  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member',
      error: error.message
    });
  }
};

/**
 * DELETE /api/team-members/:id
 * Delete team member (captain/admin only)
 */
// Support delete team member for this module.
const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    const teamMember = await TeamMember.findByPk(id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    await teamMember.destroy();
    
    res.json({
      success: true,
      message: 'Team member deleted successfully'
    });

  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team member',
      error: error.message
    });
  }
};

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
