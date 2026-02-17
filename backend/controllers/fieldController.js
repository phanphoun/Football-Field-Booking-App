const { db } = require('../config');

// Get all fields
const getAllFields = (req, res) => {
    const query = `
        SELECT f.*, u.username as owner_name
        FROM fields f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.status = 'available'
        ORDER BY f.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching fields:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Get field by ID
const getFieldById = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT f.*, u.username as owner_name
        FROM fields f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching field:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.json(results[0]);
    });
};

// Create new field
const createField = (req, res) => {
    const { name, description, address, city, province, price_per_hour, field_type, surface_type, capacity, amenities } = req.body;
    
    const query = `
        INSERT INTO fields (name, description, address, city, province, owner_id, price_per_hour, field_type, surface_type, capacity, amenities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Assuming owner_id will be set from authenticated user (for now using 1)
    db.query(query, [name, description, address, city, province, 1, price_per_hour, field_type, surface_type, capacity, JSON.stringify(amenities)], (err, result) => {
        if (err) {
            console.error('Error creating field:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Field created successfully' });
    });
};

// Update field
const updateField = (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
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
            console.error('Error updating field:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.json({ message: 'Field updated successfully' });
    });
};

// Delete field
const deleteField = (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM fields WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting field:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.json({ message: 'Field deleted successfully' });
    });
};

module.exports = {
    getAllFields,
    getFieldById,
    createField,
    updateField,
    deleteField
};
