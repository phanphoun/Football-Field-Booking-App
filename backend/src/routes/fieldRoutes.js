const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// Public routes
router.get('/', fieldController.getFields);
router.get('/:id', fieldController.getField);

// Protected routes (Field Owner, Admin)
router.post('/', auth, checkRole(['field_owner', 'admin']), fieldController.createField);
router.put('/:id', auth, checkRole(['field_owner', 'admin']), fieldController.updateField);
router.delete('/:id', auth, checkRole(['field_owner', 'admin']), fieldController.deleteField);

module.exports = router;