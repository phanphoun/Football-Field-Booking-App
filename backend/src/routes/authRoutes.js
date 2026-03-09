const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const improvedAuthController = require('../controllers/improvedAuthController');
const auth = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const authValidator = require('../validators/authValidator');

router.post('/register', userValidation.register, authController.register);
router.post('/login', userValidation.login, authController.login);
router.get('/profile', auth, authController.getProfile);
router.get('/profile/stats', auth, authController.getProfileStats);
router.put('/profile', auth, userValidation.updateProfile, authController.updateProfile);
router.put('/profile/password', auth, authController.changePassword);
router.post('/profile/avatar', auth, authController.uploadProfileAvatar);
router.delete('/profile/avatar', auth, authController.deleteProfileAvatar);
router.post('/request-field-owner', auth, authValidator.requestFieldOwner, improvedAuthController.requestFieldOwnerRole);

// Diagnostic endpoint to test the route
router.get('/test-request-field-owner', auth, (req, res) => {
  res.json({ 
    message: 'Field owner request endpoint is accessible',
    userId: req.user?.id 
  });
});

module.exports = router;
