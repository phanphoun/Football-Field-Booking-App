const express = require('express');
const router = express.Router();
const { 
    getAvailableMatches, 
    getMyRequests, 
    createMatchRequest, 
    createChallenge, 
    cancelRequest 
} = require('../controllers/matchmakingController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/available', getAvailableMatches);

// All other routes require authentication
router.use(authenticateToken);

router.get('/', getMyRequests);
router.post('/', createMatchRequest);
router.post('/challenge', createChallenge);
router.delete('/:id', cancelRequest);

module.exports = router;
