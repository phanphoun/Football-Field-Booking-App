const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { idValidation } = require('../middleware/validation');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, idValidation, userController.getUserById);

module.exports = router;
