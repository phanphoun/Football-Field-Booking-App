const express = require('express');
const router = express.Router();
const { 
    getAllFields, 
    getFieldById, 
    createField, 
    updateField, 
    deleteField 
} = require('../controllers/fieldController');
const { validateFieldId } = require('../middleware/validation');

// Public routes
router.get('/', getAllFields);
router.get('/:id', validateFieldId, getFieldById);

// Protected routes
router.post('/', createField);
router.put('/:id', validateFieldId, updateField);
router.delete('/:id', validateFieldId, deleteField);

module.exports = router;
