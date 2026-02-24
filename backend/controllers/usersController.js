const { db, mockDb } = require('../config');

// Update user profile
const updateProfile = (req, res) => {
    const userId = req.user?.userId;
    const { first_name, last_name, phone, address, date_of_birth, gender } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for updating profile');
        
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
        
        const { password_hash, ...userProfile } = mockDb.users[userIndex];
        return res.json({ message: 'Profile updated successfully', user: userProfile });
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

// Upload avatar (mock implementation)
const uploadAvatar = (req, res) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Mock implementation - just return success
    res.json({ 
        message: 'Avatar uploaded successfully',
        avatar_url: `https://via.placeholder.com/150x150/3b82f6/ffffff?text=User${userId}`
    });
};

// Get user stats
const getUserStats = (req, res) => {
    const { userId } = req.params;
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for user stats');
        
        const mockStats = {
            total_matches: 15,
            wins: 8,
            losses: 5,
            draws: 2,
            goals_scored: 23,
            goals_conceded: 17,
            yellow_cards: 3,
            red_cards: 0,
            rating: 4.2
        };
        
        return res.json(mockStats);
    }
    
    // Real database implementation would go here
    res.json({
        total_matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        goals_scored: 0,
        goals_conceded: 0,
        yellow_cards: 0,
        red_cards: 0,
        rating: 0
    });
};

module.exports = {
    updateProfile,
    uploadAvatar,
    getUserStats
};
