const express = require('express');
const router = express.Router();
const { 
    getAllTeams, 
    getTeamById, 
    createTeam, 
    getUserTeams 
} = require('../controllers/teamsController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/', getAllTeams);
router.get('/user/:userId', getUserTeams);
router.get('/:id', getTeamById);

// Protected routes
router.use(authenticateToken);

router.post('/', createTeam);

module.exports = router;
