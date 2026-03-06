const { TeamMember } = require('../models');

/**
 * GET /api/team-members
 * Simple version without complex logic
 */
const getAllTeamMembers = (req, res) => {
  console.log('Simple getAllTeamMembers called');
  
  TeamMember.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']]
  })
  .then(teamMembers => {
    console.log('Query successful, count:', teamMembers.length);
    res.json({ 
      success: true, 
      data: teamMembers.map(m => ({
        id: m.id,
        teamId: m.teamId,
        userId: m.userId,
        role: m.role,
        status: m.status,
        isActive: m.isActive
      }))
    });
  })
  .catch(error => {
    console.error('Query error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  });
};

/**
 * GET /api/team-members/:id
 */
const getTeamMemberById = (req, res) => {
  const { id } = req.params;
  
  TeamMember.findByPk(id)
    .then(teamMember => {
      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          id: teamMember.id,
          teamId: teamMember.teamId,
          userId: teamMember.userId,
          role: teamMember.role,
          status: teamMember.status,
          isActive: teamMember.isActive
        }
      });
    })
    .catch(error => {
      console.error('Get by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team member',
        error: error.message
      });
    });
};

/**
 * POST /api/team-members
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
      console.error('Create error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team member',
        error: error.message
      });
    });
};

/**
 * PUT /api/team-members/:id
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
      console.error('Update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team member',
        error: error.message
      });
    });
};

/**
 * DELETE /api/team-members/:id
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
      console.error('Delete error:', error);
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
