const express = require('express');
const router = express.Router();
const publicTeamController = require('../controllers/publicTeamController');
const { idValidation } = require('../middleware/validation');

// Public team browsing (safe fields only)
router.get('/', publicTeamController.getPublicTeams);
router.get('/:id', ...idValidation, publicTeamController.getPublicTeamById);

module.exports = router;

