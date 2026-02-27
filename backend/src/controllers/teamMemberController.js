const { TeamMember, Team, User } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllTeamMembers = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.query;
  const whereClause = {};
  
  if (teamId) whereClause.teamId = teamId;
  if (userId) whereClause.userId = userId;
  
  const teamMembers = await TeamMember.findAll({
    where: whereClause,
    include: [
      { model: Team, as: 'team' },
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  res.json({ success: true, data: teamMembers });
});

const getTeamMemberById = asyncHandler(async (req, res) => {
  const teamMember = await TeamMember.findByPk(req.params.id, {
    include: [
      { model: Team, as: 'team' },
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  
  if (!teamMember) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }
  
  res.json({ success: true, data: teamMember });
});

const createTeamMember = asyncHandler(async (req, res) => {
  try {
    const teamMember = await TeamMember.create(req.body);
    res.status(201).json({ success: true, data: teamMember });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateTeamMember = asyncHandler(async (req, res) => {
  try {
    const teamMember = await TeamMember.findByPk(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    // Authorization check
    if (teamMember.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this team member' });
    }
    
    const updatedTeamMember = await teamMember.update(req.body);
    res.json({ success: true, data: updatedTeamMember });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const deleteTeamMember = asyncHandler(async (req, res) => {
  try {
    const teamMember = await TeamMember.findByPk(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }
    
    // Authorization check
    if (teamMember.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team member' });
    }
    
    await teamMember.destroy();
    res.json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};
