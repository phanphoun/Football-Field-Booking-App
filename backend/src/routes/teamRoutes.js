const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { teamValidation, idValidation } = require('../middleware/validation');

// Protected routes
router.get('/my-teams', auth, teamController.getMyTeams);
router.get('/my-invitations', auth, teamController.getMyInvitations);
router.get('/captained', auth, checkRole(['captain', 'admin', 'field_owner']), teamController.getCaptainedTeams);

router.get('/', auth, teamController.getAllTeams);
router.get('/:id', auth, ...idValidation, teamController.getTeamById);
router.get('/:id/matches', auth, ...idValidation, teamController.getTeamMatchHistory);
router.post('/', auth, checkRole(['captain', 'admin', 'field_owner']), ...teamValidation.create, teamController.createTeam);
router.put('/:id', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.updateTeam);
router.delete('/:id', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.deleteTeam);

// Team membership flows
router.post('/:id/join', auth, checkRole(['player', 'captain', 'admin']), ...idValidation, teamController.requestJoinTeam);
router.post('/:id/leave', auth, checkRole(['player', 'captain', 'admin']), ...idValidation, teamController.leaveTeam);
router.post('/:id/leave-requests/:userId/respond', auth, ...idValidation, teamController.respondLeaveRequest);
router.get('/:id/members', auth, ...idValidation, teamController.getTeamMembers);
router.get('/:id/requests', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.getJoinRequests);
router.post('/:id/members', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.addTeamMember);
router.put('/:id/members/:userId', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.updateTeamMember);
router.delete('/:id/members/:userId', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.removeTeamMember);

// Upload team logo
router.post('/:id/logo', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, teamController.uploadTeamLogo);

// Invitation endpoints
router.post('/:id/invite', auth, checkRole(['captain', 'admin', 'field_owner']), ...idValidation, ...require('../middleware/validation').teamValidation.invite, teamController.invitePlayer);
router.post('/:id/invite/accept', auth, ...idValidation, teamController.acceptInvite);
router.post('/:id/invite/decline', auth, ...idValidation, teamController.declineInvite);

module.exports = router;
