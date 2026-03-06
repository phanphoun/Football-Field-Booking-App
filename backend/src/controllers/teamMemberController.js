const { TeamMember, Team, User, Notification } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllTeamMembers = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.query;
  const whereClause = {};
  
  if (teamId) whereClause.teamId = teamId;
  if (userId) whereClause.userId = userId;

  if (req.user.role !== 'admin') {
    let canViewTeamMembers = false;

    if (teamId) {
      const team = await Team.findByPk(teamId);
      canViewTeamMembers = team && Number(team.captain_id) === req.user.id;
    }

    if (!canViewTeamMembers) {
      if (!userId) {
        whereClause.userId = req.user.id;
      } else if (Number(userId) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to view these team members' });
      }
    }
  }
  
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
    const { teamId, userId, role } = req.body;

    if (!teamId || !userId) {
      return res.status(400).json({ success: false, message: 'teamId and userId are required' });
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (req.user.role !== 'admin' && Number(team.captain_id) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team captain can invite players' });
    }

    const existingMember = await TeamMember.findOne({ where: { teamId, userId } });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already invited or already in this team' });
    }

    const teamMember = await TeamMember.create({
      teamId,
      userId,
      role: role || 'player',
      status: 'pending',
      joinedAt: null,
      isActive: true
    });

    await Notification.create({
      userId,
      title: 'Team invitation',
      message: `You have been invited to join ${team.name}.`,
      type: 'team_invite',
      metadata: {
        teamId: team.id,
        teamMemberId: teamMember.id,
        invitedBy: req.user.id
      }
    });

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

const respondToInvitation = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['accepted', 'declined'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be accepted or declined' });
  }

  const teamMember = await TeamMember.findByPk(req.params.id, {
    include: [{ model: Team, as: 'team' }]
  });

  if (!teamMember) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }

  const isRecipient = Number(teamMember.userId) === req.user.id;
  const teamCaptainId = Number(teamMember.team?.captain_id);
  const isCaptain = req.user.role === 'admin' || teamCaptainId === req.user.id;

  if (!isRecipient && !isCaptain) {
    return res.status(403).json({ success: false, message: 'Not authorized to respond to this invitation' });
  }

  if (teamMember.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'This invitation was already processed' });
  }

  const updatedTeamMember = await teamMember.update({
    status,
    joinedAt: status === 'accepted' ? new Date() : null,
    isActive: status === 'accepted'
  });

  if (isRecipient && teamCaptainId && teamCaptainId !== req.user.id) {
    const teamName = teamMember.team?.name || 'your team';
    await Notification.create({
      userId: teamCaptainId,
      title: 'Invitation response',
      message: `A player has ${status} the invitation to join ${teamName}.`,
      type: 'team_invite',
      metadata: {
        teamId: teamMember.teamId,
        teamMemberId: teamMember.id,
        respondedBy: req.user.id,
        status
      }
    });
  }

  res.json({ success: true, data: updatedTeamMember });
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
  respondToInvitation,
  deleteTeamMember
};
