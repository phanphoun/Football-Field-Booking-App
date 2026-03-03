const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

router.post('/register', userValidation.register, authController.register);
router.post('/login', userValidation.login, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, userValidation.updateProfile, authController.updateProfile);
router.post('/profile/avatar', auth, authController.uploadProfileAvatar);
router.delete('/profile/avatar', auth, authController.deleteProfileAvatar);

module.exports = router;
