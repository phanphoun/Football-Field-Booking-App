const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const { teamValidation, idValidation } = require('../middleware/validation');

router.get('/', auth, teamController.getAllTeams);
router.get('/:id', auth, idValidation, teamController.getTeamById);
router.post('/', auth, teamValidation.create, teamController.createTeam);

module.exports = router;
