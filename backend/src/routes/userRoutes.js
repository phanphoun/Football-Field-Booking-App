const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { userValidation, idValidation } = require('../middleware/validation');

// Public routes
router.post('/register', ...userValidation.register, userController.createUser);

// Protected routes - Admin only
router.get('/', auth, checkRole(['admin']), userController.getAllUsers);
router.put('/:id', auth, checkRole(['admin']), ...idValidation, userController.updateUser);
router.delete('/:id', auth, checkRole(['admin']), ...idValidation, userController.deleteUser);

// Profile routes - Authenticated users (must come before /:id)
router.get('/profile/me', auth, userController.getProfile);
router.put('/profile/me', auth, userController.updateProfile);
router.post('/profile/avatar', auth, userController.upload.single('avatar'), userController.uploadAvatar);

// User by ID route (must come after profile routes)
router.get('/:id', auth, checkRole(['admin']), ...idValidation, userController.getUserById);

module.exports = router;
