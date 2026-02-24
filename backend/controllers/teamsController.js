const { db, mockDb } = require('../config');

// Get all teams
const getAllTeams = (req, res) => {
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for teams');
        return res.json(mockDb.teams);
    }
    
    const query = `
        SELECT t.*, u.username as captain_name, u.first_name, u.last_name
        FROM teams t
        LEFT JOIN users u ON t.captain_id = u.id
        WHERE t.status = 'active'
        ORDER BY t.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching teams:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Get team by ID
const getTeamById = (req, res) => {
    const { id } = req.params;
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for team by ID');
        
        const team = mockDb.teams.find(t => t.id == id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        return res.json(team);
    }
    
    const query = `
        SELECT t.*, u.username as captain_name, u.first_name, u.last_name
        FROM teams t
        LEFT JOIN users u ON t.captain_id = u.id
        WHERE t.id = ? AND t.status = 'active'
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching team:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(results[0]);
    });
};

// Create new team
const createTeam = (req, res) => {
    const { name, description, skill_level, home_location, max_players = 11 } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for creating team');
        
        const newTeam = {
            id: mockDb.teams.length + 1,
            name,
            captain_id: userId,
            description,
            skill_level,
            home_location,
            max_players,
            current_players: 1,
            status: 'active',
            created_at: new Date()
        };
        
        mockDb.teams.push(newTeam);
        return res.status(201).json(newTeam);
    }
    
    const query = `
        INSERT INTO teams (name, captain_id, description, skill_level, home_location, max_players, current_players, status)
        VALUES (?, ?, ?, ?, ?, ?, 1, 'active')
    `;
    
    db.query(query, [name, userId, description, skill_level, home_location, max_players], (err, result) => {
        if (err) {
            console.error('Error creating team:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.status(201).json({
            id: result.insertId,
            message: 'Team created successfully'
        });
    });
};

// Get user's teams
const getUserTeams = (req, res) => {
    const { userId } = req.params;
    
    // Check if using mock database
    if (typeof db.query === 'function' && db.query.name === 'mockQuery') {
        console.log('Using mock database for user teams');
        
        const mockUserTeams = [
            {
                id: 1,
                name: 'Phnom Penh Warriors',
                captain_id: userId == 1 ? 1 : 2,
                captain_name: userId == 1 ? 'John Player' : 'Sarah Owner',
                description: 'Competitive team looking for matches',
                skill_level: 'intermediate',
                home_location: 'phnom_penh',
                max_players: 11,
                current_players: 9,
                created_at: new Date()
            }
        ];
        
        return res.json(mockUserTeams);
    }
    
    const query = `
        SELECT t.*, u.username as captain_name, u.first_name, u.last_name,
               CASE WHEN t.captain_id = ? THEN 'captain' ELSE 'member' END as role
        FROM teams t
        LEFT JOIN users u ON t.captain_id = u.id
        LEFT JOIN team_members tm ON t.id = tm.team_id
        WHERE t.captain_id = ? OR tm.user_id = ?
        AND t.status = 'active'
        ORDER BY t.created_at DESC
    `;
    
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching user teams:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

module.exports = {
    getAllTeams,
    getTeamById,
    createTeam,
    getUserTeams
};
