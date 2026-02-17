const { db } = require('../config');

// Get all bookings for a user
const getUserBookings = (req, res) => {
    const userId = req.user.userId;
    
    const query = `
        SELECT b.*, f.name as field_name, f.address, f.city,
               t1.name as team_name, t2.name as opponent_name
        FROM bookings b
        LEFT JOIN fields f ON b.field_id = f.id
        LEFT JOIN teams t1 ON b.team_id = t1.id
        LEFT JOIN teams t2 ON b.opponent_team_id = t2.id
        WHERE b.created_by = ? OR b.team_id IN (SELECT id FROM team_members WHERE user_id = ?)
        ORDER BY b.start_time DESC
    `;
    
    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching bookings:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Create new booking
const createBooking = (req, res) => {
    const { field_id, team_id, start_time, end_time, special_requests, is_matchmaking = false } = req.body;
    const userId = req.user.userId;
    
    // Calculate total price
    const getPriceQuery = 'SELECT price_per_hour FROM fields WHERE id = ?';
    db.query(getPriceQuery, [field_id], (err, results) => {
        if (err) {
            console.error('Error getting field price:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }
        
        const pricePerHour = results[0].price_per_hour;
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        const totalPrice = pricePerHour * durationHours;
        
        const query = `
            INSERT INTO bookings (field_id, team_id, start_time, end_time, total_price, special_requests, created_by, is_matchmaking)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [field_id, team_id, start_time, end_time, totalPrice, special_requests, userId, is_matchmaking], (err, result) => {
            if (err) {
                console.error('Error creating booking:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json({
                id: result.insertId,
                message: 'Booking created successfully',
                total_price: totalPrice
            });
        });
    });
};

// Get booking by ID
const getBookingById = (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const query = `
        SELECT b.*, f.name as field_name, f.address, f.city,
               t1.name as team_name, t2.name as opponent_name
        FROM bookings b
        LEFT JOIN fields f ON b.field_id = f.id
        LEFT JOIN teams t1 ON b.team_id = t1.id
        LEFT JOIN teams t2 ON b.opponent_team_id = t2.id
        WHERE b.id = ? AND (b.created_by = ? OR b.team_id IN (SELECT id FROM team_members WHERE user_id = ?))
    `;
    
    db.query(query, [id, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching booking:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(results[0]);
    });
};

// Update booking status
const updateBookingStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    
    // Check if user owns this booking
    const checkQuery = 'SELECT created_by FROM bookings WHERE id = ?';
    db.query(checkQuery, [id], (err, results) => {
        if (err) {
            console.error('Error checking booking ownership:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        if (results[0].created_by !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this booking' });
        }
        
        const query = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.query(query, [status, id], (err, result) => {
            if (err) {
                console.error('Error updating booking:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ message: 'Booking status updated successfully' });
        });
    });
};

// Cancel booking
const cancelBooking = (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const query = `
        UPDATE bookings 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND created_by = ?
    `;
    
    db.query(query, [id, userId], (err, result) => {
        if (err) {
            console.error('Error cancelling booking:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found or not authorized' });
        }
        
        res.json({ message: 'Booking cancelled successfully' });
    });
};

module.exports = {
    getUserBookings,
    createBooking,
    getBookingById,
    updateBookingStatus,
    cancelBooking
};
