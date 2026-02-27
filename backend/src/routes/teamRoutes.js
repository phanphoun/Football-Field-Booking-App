const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { teamValidation, idValidation } = require('../middleware/validation');

// Protected routes
router.get('/', auth, teamController.getAllTeams);
router.get('/:id', auth, ...idValidation, teamController.getTeamById);
router.post('/', auth, checkRole(['captain', 'admin']), ...teamValidation.create, teamController.createTeam);
router.put('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.updateTeam);
router.delete('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamController.deleteTeam);

module.exports = router;
