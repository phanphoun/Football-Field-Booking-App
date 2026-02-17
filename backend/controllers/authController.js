const { db } = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User registration
const register = (req, res) => {
    const { username, email, password, first_name, last_name, phone, role = 'player' } = req.body;
    
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
    db.query(checkQuery, [username, email], async (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [username, email, hashedPassword, first_name, last_name, phone, role], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json({ 
                id: result.insertId, 
                message: 'User registered successfully',
                user: { id: result.insertId, username, email, first_name, last_name, role }
            });
        });
    });
};

// User login
const login = (req, res) => {
    const { username, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE username = ? AND status = "active"';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = results[0];
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
    });
};

// Get user profile
const getProfile = (req, res) => {
    const userId = req.user.userId; // From JWT middleware
    
    const query = 'SELECT id, username, email, first_name, last_name, phone, role, profile_image, created_at FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(results[0]);
    });
};

// Update user profile
const updateProfile = (req, res) => {
    const userId = req.user.userId;
    const { first_name, last_name, phone, address, date_of_birth, gender } = req.body;
    
    const query = `
        UPDATE users 
        SET first_name = ?, last_name = ?, phone = ?, address = ?, date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.query(query, [first_name, last_name, phone, address, date_of_birth, gender, userId], (err, result) => {
        if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'Profile updated successfully' });
    });
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
