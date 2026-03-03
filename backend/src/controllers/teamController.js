const { Team, User, Field, Booking, TeamMember } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getTeamBaseIncludes = () => [
  {
    model: User,
    as: 'captain',
    attributes: ['id', 'username', 'firstName', 'lastName']
  },
  {
    model: Field,
    as: 'homeField',
    attributes: ['id', 'name', 'address', 'city', 'province'],
    required: false
  }
];

const getTeamDetailsIncludes = () => [
  ...getTeamBaseIncludes(),
  {
    model: TeamMember,
    as: 'teamMembers',
    attributes: ['teamId', 'userId', 'role', 'status', 'joinedAt', 'isActive'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ],
    required: false
  },
  {
    model: Booking,
    as: 'bookings',
    required: false
  }
];

const getAllTeams = asyncHandler(async (req, res) => {
  const limit = Number.isFinite(Number(req.query.limit)) ? Math.min(Number(req.query.limit), 100) : undefined;
  const offset = Number.isFinite(Number(req.query.offset)) ? Math.max(Number(req.query.offset), 0) : undefined;
  const includeDetails =
    req.query.includeDetails === 'true' || req.query.includeDetails === '1' || req.query.details === 'true' || req.query.details === '1';

  const teams = await Team.findAll({
    include: includeDetails ? getTeamDetailsIncludes() : getTeamBaseIncludes(),
    order: [['createdAt', 'DESC']],
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {})
  });

  res.json({ success: true, data: teams });
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, {
    include: getTeamDetailsIncludes()
  });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  res.json({ success: true, data: team });
});

const getMyTeams = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [captainedTeams, memberships] = await Promise.all([
    Team.findAll({ where: { captainId: userId }, attributes: ['id'] }),
    TeamMember.findAll({
      where: { userId, status: 'active', isActive: true },
      attributes: ['teamId']
    })
  ]);

  const teamIds = Array.from(
    new Set([...captainedTeams.map((t) => t.id), ...memberships.map((m) => m.teamId)])
  );

  if (teamIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const teams = await Team.findAll({
    where: { id: teamIds },
    include: getTeamBaseIncludes(),
    order: [['createdAt', 'DESC']]
  });

  res.json({ success: true, data: teams });
});

const getCaptainedTeams = asyncHandler(async (req, res) => {
  const teams = await Team.findAll({
    where: { captainId: req.user.id },
    include: getTeamBaseIncludes(),
    order: [['createdAt', 'DESC']]
  });

  res.json({ success: true, data: teams });
});

const createTeam = asyncHandler(async (req, res) => {
  try {
    const { name, description, skillLevel, maxPlayers, homeFieldId, logoUrl, isActive } = req.body;

    const team = await Team.create({
      name,
      description,
      skillLevel,
      maxPlayers,
      homeFieldId,
      logoUrl,
      isActive,
      captainId: req.user.id
    });

    await TeamMember.create({
      teamId: team.id,
      userId: req.user.id,
      role: 'captain',
      status: 'active',
      isActive: true
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

    if (team.captainId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this team' });
    }

    const updatableFields = ['name', 'description', 'skillLevel', 'maxPlayers', 'homeFieldId', 'logoUrl', 'isActive'];
    const updateData = {};
    for (const key of updatableFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const updatedTeam = await team.update(updateData);
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

    if (team.captainId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team' });
    }

    await team.destroy();
    res.json({ success: true, data: { id: team.id }, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

const requestJoinTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  if (team.captainId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You are already the captain of this team' });
  }

  const existing = await TeamMember.findOne({
    where: {
      teamId: team.id,
      userId: req.user.id
    }
  });

  if (existing) {
    if (existing.status === 'active') {
      return res.status(400).json({ success: false, message: 'You are already a member of this team' });
    }
    if (existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Join request is already pending' });
    }

    await existing.update({ status: 'pending', isActive: true });
    return res.json({ success: true, data: existing, message: 'Join request submitted' });
  }

  const request = await TeamMember.create({
    teamId: team.id,
    userId: req.user.id,
    role: 'player',
    status: 'pending',
    isActive: true
  });

  res.status(201).json({ success: true, data: request, message: 'Join request submitted' });
});

const leaveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  if (team.captainId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Team captain cannot leave the team. Transfer captaincy or delete the team instead.'
    });
  }

  const membership = await TeamMember.findOne({
    where: {
      teamId: team.id,
      userId: req.user.id
    }
  });

  if (!membership || membership.status === 'inactive') {
    return res.status(400).json({ success: false, message: 'You are not an active member of this team' });
  }

  await membership.update({ status: 'inactive', isActive: false });
  res.json({ success: true, data: membership, message: 'Left team successfully' });
});

const getTeamMembers = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const members = await TeamMember.findAll({
    where: { teamId: team.id },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ],
    order: [
      ['status', 'ASC'],
      ['role', 'ASC'],
      ['joinedAt', 'DESC']
    ]
  });

  res.json({ success: true, data: members });
});

const getJoinRequests = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isCaptainOfTeam = team.captainId === req.user.id;

  if (!isAdmin && !isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to view join requests for this team' });
  }

  const requests = await TeamMember.findAll({
    where: { teamId: team.id, status: 'pending' },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({ success: true, data: requests });
});

const addTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isCaptainOfTeam = team.captainId === req.user.id;

  if (!isAdmin && !isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to manage members for this team' });
  }

  const { userId, role } = req.body;

  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return res.status(400).json({ success: false, message: 'userId must be a positive integer' });
  }

  const allowedRoles = ['player', 'substitute'];
  if (role !== undefined && !allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `role must be one of: ${allowedRoles.join(', ')}` });
  }

  const existing = await TeamMember.findOne({ where: { teamId: team.id, userId: parsedUserId } });

  if (existing && existing.status === 'active') {
    return res.status(400).json({ success: false, message: 'User is already an active member of this team' });
  }

  if (existing) {
    await existing.update({
      status: 'active',
      isActive: true,
      role: role || existing.role
    });
    return res.json({ success: true, data: existing, message: 'Member added successfully' });
  }

  const member = await TeamMember.create({
    teamId: team.id,
    userId: parsedUserId,
    role: role || 'player',
    status: 'active',
    isActive: true
  });

  res.status(201).json({ success: true, data: member, message: 'Member added successfully' });
});

const updateTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isCaptainOfTeam = team.captainId === req.user.id;

  if (!isAdmin && !isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to manage members for this team' });
  }

  const targetUserId = Number(req.params.userId);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ success: false, message: 'userId must be a positive integer' });
  }

  const membership = await TeamMember.findOne({
    where: { teamId: team.id, userId: targetUserId }
  });

  if (!membership) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }

  const { status, role } = req.body;
  const allowedStatuses = ['pending', 'active', 'inactive'];

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${allowedStatuses.join(', ')}` });
  }

  const allowedRoles = ['player', 'substitute'];
  if (role !== undefined && !allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `role must be one of: ${allowedRoles.join(', ')}` });
  }

  const updateData = {};
  if (status !== undefined) {
    updateData.status = status;
    updateData.isActive = status === 'active';
  }
  if (role !== undefined) updateData.role = role;

  const updated = await membership.update(updateData);
  res.json({ success: true, data: updated, message: 'Team member updated successfully' });
});

const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isCaptainOfTeam = team.captainId === req.user.id;

  if (!isAdmin && !isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to manage members for this team' });
  }

  const targetUserId = Number(req.params.userId);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ success: false, message: 'userId must be a positive integer' });
  }

  const membership = await TeamMember.findOne({
    where: { teamId: team.id, userId: targetUserId }
  });

  if (!membership) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }

  await membership.update({ status: 'inactive', isActive: false });
  res.json({ success: true, data: membership, message: 'Member removed successfully' });
});

module.exports = {
  getAllTeams,
  getTeamById,
  getMyTeams,
  getCaptainedTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  requestJoinTeam,
  leaveTeam,
  getTeamMembers,
  getJoinRequests,
  addTeamMember,
  updateTeamMember,
  removeTeamMember
};
