const { db, mockDb, isUsingMockDb } = require('../config');
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js

// Get all fields
const getAllFields = (req, res) => {
=======
const { 
    NotFoundError,
    DatabaseError,
    asyncHandler,
    handleDatabaseError
} = require('../middleware/errorHandler');

// Get all fields
const getAllFields = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
const { 
    NotFoundError,
    DatabaseError,
    asyncHandler,
    handleDatabaseError
} = require('../middleware/errorHandler');

// Get all fields
const getAllFields = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
const { 
    NotFoundError,
    DatabaseError,
    asyncHandler,
    handleDatabaseError
} = require('../middleware/errorHandler');

// Get all fields
const getAllFields = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
const { 
    NotFoundError,
    DatabaseError,
    asyncHandler,
    handleDatabaseError
} = require('../middleware/errorHandler');

// Get all fields
const getAllFields = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
    if (isUsingMockDb()) {
        console.log('Using mock data for fields');
        return res.json(mockDb.fields);
    }
    
    const query = `
        SELECT f.*, u.username as owner_name, u.first_name as owner_first_name, u.last_name as owner_last_name
        FROM fields f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.status = 'available'
        ORDER BY f.rating DESC, f.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return handleDatabaseError(err, 'fetch fields');
        }
        res.json(results);
    });
});

// Get field by ID
const getFieldById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
    // Validate ID parameter
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid field ID' });
    }
    
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
    if (isUsingMockDb()) {
        const field = mockDb.fields.find(f => f.id == id);
        if (!field) {
            throw new NotFoundError('Field');
        }
        return res.json(field);
    }
    
    const query = `
        SELECT f.*, u.username as owner_name, u.first_name as owner_first_name, u.last_name as owner_last_name
        FROM fields f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.id = ? AND f.status = 'available'
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            return handleDatabaseError(err, 'fetch field by ID');
        }
        
        if (results.length === 0) {
            throw new NotFoundError('Field');
        }
        
        res.json(results[0]);
    });
});

// Create new field
const createField = asyncHandler(async (req, res) => {
    const { name, description, address, city, province, price_per_hour, field_type, surface_type, capacity, amenities } = req.body;
    
    // Check if using mock database
    if (isUsingMockDb()) {
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/fieldController.js
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/fieldController.js
        const newField = {
            id: mockDb.fields.length + 1,
            name,
            description,
            location: `${city}, ${province}`,
            pricePerHour: price_per_hour,
            image: 'https://via.placeholder.com/400x225/22c55e/ffffff?text=Football+Field',
            rating: 4.0,
            reviews: 0
        };
        mockDb.fields.push(newField);
        return res.status(201).json(newField);
    }
    
    const query = `
        INSERT INTO fields (name, description, address, city, province, owner_id, price_per_hour, field_type, surface_type, capacity, amenities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Assuming owner_id will be set from authenticated user (for now using 1)
    db.query(query, [name, description, address, city, province, 1, price_per_hour, field_type, surface_type, capacity, JSON.stringify(amenities)], (err, result) => {
        if (err) {
            return handleDatabaseError(err, 'create field');
        }
        res.status(201).json({ id: result.insertId, message: 'Field created successfully' });
    });
});

// Update field
const updateField = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if using mock database
    if (isUsingMockDb()) {
        const fieldIndex = mockDb.fields.findIndex(f => f.id == id);
        if (fieldIndex === -1) {
            throw new NotFoundError('Field');
        }
        mockDb.fields[fieldIndex] = { ...mockDb.fields[fieldIndex], ...updates };
        return res.json({ message: 'Field updated successfully' });
    }
    
    const query = `
        UPDATE fields 
        SET name = ?, description = ?, address = ?, city = ?, province = ?, 
            price_per_hour = ?, field_type = ?, surface_type = ?, capacity = ?, 
            amenities = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.query(query, [
        updates.name, updates.description, updates.address, updates.city, 
        updates.province, updates.price_per_hour, updates.field_type, 
        updates.surface_type, updates.capacity, JSON.stringify(updates.amenities), id
    ], (err, result) => {
        if (err) {
            return handleDatabaseError(err, 'update field');
        }
        if (result.affectedRows === 0) {
            throw new NotFoundError('Field');
        }
        res.json({ message: 'Field updated successfully' });
    });
});

// Delete field
const deleteField = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if using mock database
    if (isUsingMockDb()) {
        const fieldIndex = mockDb.fields.findIndex(f => f.id == id);
        if (fieldIndex === -1) {
            throw new NotFoundError('Field');
        }
        mockDb.fields.splice(fieldIndex, 1);
        return res.json({ message: 'Field deleted successfully' });
    }
    
    db.query('DELETE FROM fields WHERE id = ?', [id], (err, result) => {
        if (err) {
            return handleDatabaseError(err, 'delete field');
        }
        if (result.affectedRows === 0) {
            throw new NotFoundError('Field');
        }
        res.json({ message: 'Field deleted successfully' });
    });
});

module.exports = {
    getAllFields,
    getFieldById,
    createField,
    updateField,
    deleteField
};
