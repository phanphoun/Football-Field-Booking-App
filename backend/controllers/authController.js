const { db, mockDb, isUsingMockDb } = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
    ValidationError, 
    DatabaseError, 
    AuthenticationError, 
    ConflictError,
    asyncHandler,
    handleDatabaseError
} = require('../middleware/errorHandler');
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js

// Input validation helper
const validateRegistrationInput = (req, res) => {
    const { username, email, password, first_name, last_name, phone, role = 'player' } = req.body;
    
    if (!username || !email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (!['player', 'field_owner', 'team_captain', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    return null; // No validation error
};

// User registration
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
const register = (req, res) => {
    const validationError = validateRegistrationInput(req, res);
    if (validationError) return;
    
=======
const register = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======

// User registration
const register = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======

// User registration
const register = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======

// User registration
const register = asyncHandler(async (req, res) => {
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
    const { username, email, password, first_name, last_name, phone, role = 'player' } = req.body;
    
    if (isUsingMockDb()) {
        console.log('Using mock database for registration');
        
        // Check if user already exists in mock data
        const existingUser = mockDb.users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            throw new ConflictError('Username or email already exists');
        }
        
        // Hash password
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
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
=======
        const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
        const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
        
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
        
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
=======
        const hashedPassword = await bcrypt.hash(password, 12);
        
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
        
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
        const hashedPassword = await bcrypt.hash(password, 12);
        
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
        
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
        mockDb.users.push(newUser);
        
        res.status(201).json({ 
            id: newUser.id, 
            message: 'User registered successfully',
            user: { id: newUser.id, username, email, first_name, last_name, role }
        });
        return;
    }
    
    // Real database registration
    const checkQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
    db.query(checkQuery, [username, email], async (err, results) => {
        if (err) {
            return handleDatabaseError(err, 'user registration check');
        }
        
        if (results.length > 0) {
            throw new ConflictError('Username or email already exists');
        }
        
        try {
            // Hash password
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
            const hashedPassword = await bcrypt.hash(password, 10);
=======
            const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            const hashedPassword = await bcrypt.hash(password, 12);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
            
            const query = `
                INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.query(query, [username, email, hashedPassword, first_name, last_name, phone, role], (err, result) => {
                if (err) {
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
                    console.error('Error creating user:', err);
                    return res.status(500).json({ error: 'Database error' });
=======
                    return handleDatabaseError(err, 'user registration');
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
                    return handleDatabaseError(err, 'user registration');
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
                    return handleDatabaseError(err, 'user registration');
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
                    return handleDatabaseError(err, 'user registration');
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
                }
                
                res.status(201).json({ 
                    id: result.insertId, 
                    message: 'User registered successfully',
                    user: { id: result.insertId, username, email, first_name, last_name, role }
                });
            });
        } catch (hashError) {
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/controllers/authController.js
            console.error('Error hashing password:', hashError);
            return res.status(500).json({ error: 'Error hashing password' });
=======
            throw new DatabaseError('Error hashing password', hashError);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            throw new DatabaseError('Error hashing password', hashError);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            throw new DatabaseError('Error hashing password', hashError);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
=======
            throw new DatabaseError('Error hashing password', hashError);
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-9e5cda3a/backend/controllers/authController.js
        }
    });
});

// User login
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    if (isUsingMockDb()) {
        console.log('Using mock database for login');
        
        const user = mockDb.users.find(u => u.username === username || u.email === username);
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid credentials');
        }
        
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
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
        return;
    }
    
    // Real database login
    const query = `
        SELECT id, username, email, password_hash, first_name, last_name, role, is_active 
        FROM users 
        WHERE email = ? OR username = ? 
        AND is_active = TRUE
    `;
    
    db.query(query, [username, username], async (err, results) => {
        if (err) {
            return handleDatabaseError(err, 'user login');
        }
        
        if (results.length === 0) {
            throw new AuthenticationError('Invalid credentials');
        }
        
        const user = results[0];
        
        try {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                throw new AuthenticationError('Invalid credentials');
            }
            
            // Update last login
            const updateLoginQuery = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
            db.query(updateLoginQuery, [user.id]);
            
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
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
        } catch (passwordError) {
            throw new AuthenticationError('Authentication failed');
        }
    });
});

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    
    if (isUsingMockDb()) {
        console.log('Using mock database for user profile');
        
        const user = mockDb.users.find(u => u.id == userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: user.role,
            created_at: user.created_at
        });
        return;
    }
    
    const query = `
        SELECT id, username, email, first_name, last_name, phone, role, avatar_url, 
               is_active, email_verified, last_login, created_at
        FROM users 
        WHERE id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return handleDatabaseError(err, 'get user profile');
        }
        
        if (results.length === 0) {
            throw new Error('User not found');
        }
        
        res.json(results[0]);
    });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { first_name, last_name, phone, avatar_url } = req.body;
    
    if (isUsingMockDb()) {
        console.log('Using mock database for profile update');
        
        const user = mockDb.users.find(u => u.id == userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.phone = phone || user.phone;
        user.avatar_url = avatar_url || user.avatar_url;
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
        return;
    }
    
    const query = `
        UPDATE users 
        SET first_name = ?, last_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.query(query, [first_name, last_name, phone, avatar_url, userId], (err, result) => {
        if (err) {
            return handleDatabaseError(err, 'update user profile');
        }
        
        if (result.affectedRows === 0) {
            throw new Error('User not found');
        }
        
        res.json({
            message: 'Profile updated successfully',
            user: { id: userId, first_name, last_name, phone, avatar_url }
        });
    });
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
