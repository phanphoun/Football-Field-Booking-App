const { Team, User, Field, Booking, TeamMember, Notification } = require('../models');

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
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
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

    // Delete all team members (they auto-leave when team is deleted)
    await TeamMember.destroy({
      where: { teamId: team.id }
    });

    // Delete all notifications related to this team
    await Notification.destroy({
      where: {
        type: 'team_invite',
        metadata: {
          teamId: team.id
        }
      }
    });

    // Delete the team
    await team.destroy();
    
    res.json({ success: true, data: { id: team.id }, message: 'Team deleted successfully. All members have been removed from the team.' });
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
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
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
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatarUrl']
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

// Upload team logo (captain only)
const uploadTeamLogo = asyncHandler(async (req, res) => {
  const multer = require('multer');
  const fs = require('fs');
  const path = require('path');
  const serverConfig = require('../config/serverConfig');
  const maxLogoSize = serverConfig.upload.maxSize;

  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId', 'logoUrl'] });
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const isCaptainOfTeam = team.captainId === req.user.id;
  if (!isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to update team logo' });
  }

  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const uploadDir = path.resolve(projectRoot, 'frontend', 'public', 'uploads', 'team-logo');
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `team_${team.id}_${Date.now()}${ext}`;
      cb(null, filename);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxLogoSize },
    fileFilter: (req, file, cb) => {
      const allowed = serverConfig.upload.allowedTypes;
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Invalid file type'));
      }
      cb(null, true);
    }
  }).single('logo');

  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMb = Math.round(maxLogoSize / (1024 * 1024));
        return res.status(400).json({ success: false, message: `Logo image must be ${maxMb}MB or smaller` });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // delete previous logo file if exists (optional)
    try {
      if (team.logoUrl && typeof team.logoUrl === 'string' && team.logoUrl.startsWith('/uploads')) {
        let previousLogoAbsolutePath = null;

        if (team.logoUrl.startsWith('/uploads/team-logo/')) {
          previousLogoAbsolutePath = path.resolve(projectRoot, 'frontend', 'public', team.logoUrl.replace(/^\//, ''));
        } else {
          // Backward compatibility for previously uploaded files in backend/uploads/*
          previousLogoAbsolutePath = path.resolve(__dirname, '..', '..', team.logoUrl.replace(/^\//, ''));
        }

        if (fs.existsSync(previousLogoAbsolutePath)) {
          fs.unlinkSync(previousLogoAbsolutePath);
        }
      }
    } catch (unlinkErr) {
      // ignore unlink errors
    }

    const publicPath = `/uploads/team-logo/${req.file.filename}`;
    await team.update({ logoUrl: publicPath });

    res.json({ success: true, data: { logoUrl: publicPath }, message: 'Logo uploaded successfully' });
  });
});

// captain/admin can invite a player by creating a pending membership and notifying them
const invitePlayer = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id', 'captainId', 'name'] });

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isCaptainOfTeam = team.captainId === req.user.id;

  if (!isAdmin && !isCaptainOfTeam) {
    return res.status(403).json({ success: false, message: 'Not authorized to invite players to this team' });
  }

  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const targetUser = await User.findOne({ where: { email: normalizedEmail } });
  const parsedUserId = targetUser ? targetUser.id : null;

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'No player account found with this email' });
  }

  if (targetUser.role !== 'player') {
    return res.status(400).json({ success: false, message: 'Only users with player role can be invited' });
  }

  if (parsedUserId === team.captainId) {
    return res.status(400).json({ success: false, message: 'Cannot invite yourself' });
  }

  const existing = await TeamMember.findOne({ where: { teamId: team.id, userId: parsedUserId } });
  if (existing) {
    if (existing.status === 'active') {
      return res.status(400).json({ success: false, message: 'User is already an active member of this team' });
    }
    if (existing.status === 'pending') {
      return res.status(400).json({ success: false, message: 'There is already a pending request or invitation for this user' });
    }
  }

  let membership;
  if (existing) {
    membership = await existing.update({
      role: 'player',
      status: 'pending',
      isActive: false
    });
  } else {
    membership = await TeamMember.create({
      teamId: team.id,
      userId: parsedUserId,
      role: 'player',
      status: 'pending',
      isActive: false
    });
  }

  await Notification.create({
    userId: parsedUserId,
    title: `Invitation to join ${team.name}`,
    message: `You have been invited by ${req.user.firstName || req.user.username} to join the team "${team.name}".`,
    type: 'team_invite',
    metadata: { teamId: team.id, inviterId: req.user.id }
  });

  res.status(201).json({ success: true, data: membership, message: 'Invitation sent' });
});

// invitee can accept the invitation
const acceptInvite = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id'] });
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const userId = req.user.id;
  const membership = await TeamMember.findOne({ where: { teamId: team.id, userId } });
  if (!membership || membership.status !== 'pending' || membership.isActive) {
    return res.status(400).json({ success: false, message: 'No pending invitation found' });
  }

  await membership.update({ status: 'active', isActive: true });
  res.json({ success: true, data: membership, message: 'Invitation accepted' });
});

// invitee can decline the invitation
const declineInvite = asyncHandler(async (req, res) => {
  const team = await Team.findByPk(req.params.id, { attributes: ['id'] });
  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }

  const userId = req.user.id;
  const membership = await TeamMember.findOne({ where: { teamId: team.id, userId } });
  if (!membership || membership.status !== 'pending' || membership.isActive) {
    return res.status(400).json({ success: false, message: 'No pending invitation found' });
  }

  await membership.update({ status: 'inactive', isActive: false });
  res.json({ success: true, data: membership, message: 'Invitation declined' });
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
  removeTeamMember,
  invitePlayer,
  acceptInvite,
  declineInvite
  ,
  uploadTeamLogo
};
