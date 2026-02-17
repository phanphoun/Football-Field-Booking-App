const express = require('express');
const router = express.Router();
const { 
    getAllFields, 
    getFieldById, 
    createField, 
    updateField, 
    deleteField 
} = require('../controllers/fieldController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', getAllFields);
router.get('/:id', getFieldById);

// Protected routes
router.post('/', authenticateToken, requireRole(['field_owner', 'admin']), createField);
router.put('/:id', authenticateToken, requireRole(['field_owner', 'admin']), updateField);
router.delete('/:id', authenticateToken, requireRole(['field_owner', 'admin']), deleteField);

module.exports = router;
