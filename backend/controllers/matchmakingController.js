const { db, mockDb } = require('../config');

// Get available matches
const getAvailableMatches = (req, res) => {
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for available matches');
        
        // Mock available matches data
        const mockMatches = [
            {
                id: 1,
                team_name: 'Phnom Penh Warriors',
                captain_id: 1,
                captain_name: 'John Player',
                skill_level: 'intermediate',
                location: 'phnom_penh',
                preferred_time: 'evening',
                players_needed: 2,
                max_players: 11,
                description: 'Looking for players for a friendly match',
                created_at: new Date()
            },
            {
                id: 2,
                team_name: 'Siem Reap United',
                captain_id: 2,
                captain_name: 'Sarah Owner',
                skill_level: 'advanced',
                location: 'siem_reap',
                preferred_time: 'afternoon',
                players_needed: 3,
                max_players: 11,
                description: 'Competitive match, experienced players preferred',
                created_at: new Date()
            },
            {
                id: 3,
                team_name: 'Battambang Eagles',
                captain_id: 3,
                captain_name: 'Mike Captain',
                skill_level: 'beginner',
                location: 'battambang',
                preferred_time: 'morning',
                players_needed: 5,
                max_players: 11,
                description: 'Casual game for beginners and intermediates',
                created_at: new Date()
            }
        ];
        
        return res.json(mockMatches);
    }
    
    const query = `
        SELECT m.*, u.username as captain_name, u.first_name, u.last_name
        FROM matchmaking_requests m
        LEFT JOIN users u ON m.captain_id = u.id
        WHERE m.status = 'open' 
        AND m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY m.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching available matches:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Get user's match requests
const getMyRequests = (req, res) => {
    const userId = req.user?.userId || req.query.userId;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for user requests');
        
        // Mock user requests
        const mockRequests = [
            {
                id: 1,
                requester_id: userId,
                opponent_team: 'Phnom Penh Warriors',
                opponent_captain: 'John Player',
                match_date: '2024-02-25',
                preferred_time: 'evening',
                location: 'phnom_penh',
                status: 'pending',
                request_date: new Date(),
                message: 'Looking forward to a great match!'
            }
        ];
        
        return res.json(mockRequests);
    }
    
    const query = `
        SELECT mr.*, u.username as opponent_captain
        FROM matchmaking_requests mr
        LEFT JOIN users u ON mr.captain_id = u.id
        WHERE (mr.requester_id = ? OR mr.captain_id = ?)
        ORDER BY mr.request_date DESC
    `;
    
    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching user requests:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Create match request
const createMatchRequest = (req, res) => {
    const { team_name, skill_level, location, preferred_time, players_needed, description } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for creating match request');
        
        const newRequest = {
            id: mockDb.teams.length + 1,
            captain_id: userId,
            team_name,
            skill_level,
            location,
            preferred_time,
            players_needed,
            max_players: 11,
            description,
            status: 'open',
            created_at: new Date()
        };
        
        mockDb.teams.push(newRequest);
        return res.status(201).json(newRequest);
    }
    
    const query = `
        INSERT INTO matchmaking_requests 
        (captain_id, team_name, skill_level, location, preferred_time, players_needed, max_players, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `;
    
    db.query(query, [userId, team_name, skill_level, location, preferred_time, players_needed, 11, description], (err, result) => {
        if (err) {
            console.error('Error creating match request:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({
            id: result.insertId,
            message: 'Match request created successfully'
        });
    });
};

// Create challenge (respond to match request)
const createChallenge = (req, res) => {
    const { match_id, challenger_id, challenger_team } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for creating challenge');
        
        const challenge = {
            id: mockDb.bookings.length + 1,
            match_id,
            challenger_id: userId || challenger_id,
            challenger_team,
            status: 'pending',
            created_at: new Date()
        };
        
        mockDb.bookings.push(challenge);
        return res.status(201).json(challenge);
    }
    
    const query = `
        INSERT INTO match_challenges 
        (match_id, challenger_id, challenger_team, status)
        VALUES (?, ?, ?, 'pending')
    `;
    
    db.query(query, [match_id, challenger_id, challenger_team], (err, result) => {
        if (err) {
            console.error('Error creating challenge:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({
            id: result.insertId,
            message: 'Challenge sent successfully'
        });
    });
};

// Cancel match request
const cancelRequest = (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for canceling request');
        
        const requestIndex = mockDb.teams.findIndex(req => req.id == id);
        if (requestIndex === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        mockDb.teams.splice(requestIndex, 1);
        return res.json({ message: 'Request cancelled successfully' });
    }
    
    const query = 'DELETE FROM matchmaking_requests WHERE id = ? AND captain_id = ?';
    
    db.query(query, [id, userId], (err, result) => {
        if (err) {
            console.error('Error canceling request:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ message: 'Request cancelled successfully' });
    });
};

module.exports = {
    getAvailableMatches,
    getMyRequests,
    createMatchRequest,
    createChallenge,
    cancelRequest
};
