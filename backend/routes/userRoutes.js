const express = require('express');
const router = express.Router();
const userController = require('../controllers/users/userController');

// Route: POST /api/users/register
// Register a new user with role
router.post('/register', userController.register);

// Route: POST /api/users/login
// Login user with email and password
router.post('/login', userController.login);

// Route: GET /api/users
// Get all users (for admin)
router.get('/', userController.getAllUsers);

module.exports = router;

