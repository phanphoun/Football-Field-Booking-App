const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { teamValidation, idValidation } = require('../middleware/validation');

// Protected routes
router.get('/my-teams', auth, teamController.getMyTeams);
router.get('/captained', auth, checkRole(['captain', 'admin']), teamController.getCaptainedTeams);

router.get('/', auth, teamController.getAllTeams);
router.get('/:id', auth, ...idValidation, teamController.getTeamById);
router.post('/', auth, checkRole(['captain', 'admin']), ...teamValidation.create, teamController.createTeam);
router.put('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.updateTeam);
router.delete('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.deleteTeam);

// Team membership flows
router.post('/:id/join', auth, checkRole(['player', 'captain', 'admin']), ...idValidation, teamController.requestJoinTeam);
router.post('/:id/leave', auth, checkRole(['player', 'captain', 'admin']), ...idValidation, teamController.leaveTeam);
router.get('/:id/members', auth, ...idValidation, teamController.getTeamMembers);
router.get('/:id/requests', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.getJoinRequests);
router.post('/:id/members', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.addTeamMember);
router.put('/:id/members/:userId', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.updateTeamMember);
router.delete('/:id/members/:userId', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.removeTeamMember);

module.exports = router;
