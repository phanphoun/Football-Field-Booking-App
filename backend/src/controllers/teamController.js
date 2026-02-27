const { Team, User, Booking, TeamMember } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllTeams = asyncHandler(async (req, res) => {
  const teams = await Team.findAll({
    include: [
      { model: User, as: 'captain', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: TeamMember, as: 'teamMembers', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }] },
      { model: Booking, as: 'bookings' }
    ]
  });
  res.json({ success: true, data: teams });
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, {
    include: [
      { model: User, as: 'captain', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] },
      { model: TeamMember, as: 'teamMembers', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }] },
      { model: Booking, as: 'bookings' }
    ]
  });
  
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }
  
  res.json({ success: true, data: team });
});

const createTeam = asyncHandler(async (req, res) => {
  try {
    const team = await Team.create({
      ...req.body,
      captain_id: req.user.id
    });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateTeam = asyncHandler(async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Authorization check
    if (team.captain_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this team' });
    }
    
    const updatedTeam = await team.update(req.body);
    res.json({ success: true, data: updatedTeam });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

const deleteTeam = asyncHandler(async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Authorization check
    if (team.captain_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team' });
    }
    
    await team.destroy();
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
};
