const express = require('express');
const router = express.Router();
const { 
    updateProfile, 
    uploadAvatar, 
    getUserStats 
} = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.get('/:userId/stats', getUserStats);

module.exports = router;
