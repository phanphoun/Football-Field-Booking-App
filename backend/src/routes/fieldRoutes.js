const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { fieldValidation, idValidation } = require('../middleware/validation');

// Public routes
router.get('/', fieldController.getFields);
router.get('/:id', idValidation, fieldController.getField);

// Protected routes (Field Owner, Admin)
router.post('/', auth, checkRole(['field_owner', 'admin']), fieldValidation.create, fieldController.createField);
router.put('/:id', auth, checkRole(['field_owner', 'admin']), idValidation, fieldValidation.create, fieldController.updateField);
router.delete('/:id', auth, checkRole(['field_owner', 'admin']), idValidation, fieldController.deleteField);

module.exports = router;