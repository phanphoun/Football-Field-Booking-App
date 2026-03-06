const express = require('express');
const router = express.Router();
const publicTeamController = require('../controllers/publicTeamController');
const bookingController = require('../controllers/bookingController');
const { idValidation } = require('../middleware/validation');

// Public team browsing
router.get('/teams', publicTeamController.getPublicTeams);
router.get('/teams/:id', ...idValidation, publicTeamController.getPublicTeamById);

// Public schedule for landing page
router.get('/schedule', bookingController.getPublicSchedule);

module.exports = router;
