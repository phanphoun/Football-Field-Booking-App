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

const createTeamMember = asyncHandler(async (req, res) => {
  const teamMember = await TeamMember.create(req.body);
  res.status(201).json({ success: true, data: teamMember });
});

module.exports = {
  getAllTeamMembers,
  createTeamMember
};
