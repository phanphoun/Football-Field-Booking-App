const { db, mockDb } = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User registration
const register = (req, res) => {
    const { username, email, password, first_name, last_name, phone, role = 'player' } = req.body;
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for registration');
        
        // Check if user already exists in mock data
        const existingUser = mockDb.users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error hashing password' });
            }
            
            // Create new user in mock database
            const newUser = {
                id: mockDb.users.length + 1,
                username,
                email,
                password_hash: hashedPassword,
                first_name,
                last_name,
                phone,
                role,
                created_at: new Date()
            };
            
            mockDb.users.push(newUser);
            
            res.status(201).json({ 
                id: newUser.id, 
                message: 'User registered successfully',
                user: { id: newUser.id, username, email, first_name, last_name, role }
            });
        });
        
        return;
    }
    
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
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for login');
        
        const user = mockDb.users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        bcrypt.compare(password, user.password_hash, (err, isValid) => {
            if (err || !isValid) {
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
        
        return;
    }
    
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
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for profile');
        
        const user = mockDb.users.find(u => u.id == userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user without password hash
        const { password_hash, ...userProfile } = user;
        res.json(userProfile);
        return;
    }
    
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
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for profile update');
        
        const userIndex = mockDb.users.findIndex(u => u.id == userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        mockDb.users[userIndex] = {
            ...mockDb.users[userIndex],
            first_name,
            last_name,
            phone,
            address,
            date_of_birth,
            gender,
            updated_at: new Date()
        };
        
        res.json({ message: 'Profile updated successfully' });
        return;
    }
    
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
