

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { config } = require('./config/env');

const app = express();

// Middleware
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials
}));
app.use(express.json());

// Database configuration
const dbConfig = {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
};

// Create database connection
const db = mysql.createConnection(dbConfig);

// Database connection handler
const connectDatabase = () => {
    return new Promise((resolve, reject) => {
        db.connect((err) => {
            if (err) {
                console.log('MySQL connection failed, using mock database for development');
                console.log('Connection details:', {
                    host: dbConfig.host,
                    user: dbConfig.user,
                    database: dbConfig.database,
                    passwordSet: !!dbConfig.password
                });
                resolve(false); // Connection failed
            } else {
                console.log('Connected to MySQL database: football_booking');
                resolve(true); // Connection successful
            }
        });
    });
};

// Mock database for development
const mockDb = {
    users: [
        {
            id: 1,
            username: 'player1',
            email: 'player@example.com',
            password_hash: '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4',
            first_name: 'John',
            last_name: 'Player',
            phone: '012345678',
            role: 'player',
            created_at: new Date('2024-01-15')
        },
        {
            id: 2,
            username: 'fieldowner1',
            email: 'owner@example.com',
            password_hash: '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4',
            first_name: 'Sarah',
            last_name: 'Owner',
            phone: '023456789',
            role: 'field_owner',
            created_at: new Date('2024-01-10')
        },
        {
            id: 3,
            username: 'captain1',
            email: 'captain@example.com',
            password_hash: '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4',
            first_name: 'Mike',
            last_name: 'Captain',
            phone: '034567890',
            role: 'team_captain',
            created_at: new Date('2024-01-12')
        },
        {
            id: 4,
            username: 'admin1',
            email: 'admin@example.com',
            password_hash: '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4',
            first_name: 'Admin',
            last_name: 'User',
            phone: '045678901',
            role: 'admin',
            created_at: new Date('2024-01-01')
        }
    ],
    teams: [
        {
            id: 1,
            name: 'Phnom Penh Warriors',
            captain_id: 1,
            captain_name: 'John Player',
            description: 'Competitive team looking for matches',
            skill_level: 'intermediate',
            home_location: 'phnom_penh',
            max_players: 11,
            current_players: 9,
            created_at: new Date()
        },
        {
            id: 2,
            name: 'Siem Reap United',
            captain_id: 2,
            captain_name: 'Sarah Owner',
            description: 'Friendly team for casual matches',
            skill_level: 'advanced',
            home_location: 'siem_reap',
            max_players: 11,
            current_players: 11,
            created_at: new Date()
        },
        {
            id: 3,
            name: 'Battambang Eagles',
            captain_id: 3,
            captain_name: 'Mike Captain',
            description: 'Beginner-friendly team',
            skill_level: 'beginner',
            home_location: 'battambang',
            max_players: 11,
            current_players: 7,
            created_at: new Date()
        }
    ],
    fields: [
        {
            id: 1,
            name: 'Phnom Penh Football Stadium',
            location: 'Phnom Penh',
            pricePerHour: 50,
            image: 'https://via.placeholder.com/400x225/22c55e/ffffff?text=Football+Field',
            rating: 4.5,
            reviews: 128,
            description: 'Premium football field with professional facilities'
        },
        {
            id: 2,
            name: 'Siem Reap Sports Complex',
            location: 'Siem Reap',
            pricePerHour: 45,
            image: 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=Football+Field',
            rating: 4.3,
            reviews: 89,
            description: 'Modern sports complex with multiple fields'
        }
    ],
    bookings: []
};

// Mock query function
const mockQuery = (sql, params, callback) => {
    console.log('Mock DB Query:', sql, params);
    
    // Simulate async operation
    setTimeout(() => {
        if (sql.includes('INSERT INTO users')) {
            const newUser = {
                id: mockDb.users.length + 1,
                ...params[1],
                created_at: new Date()
            };
            mockDb.users.push(newUser);
            callback(null, { insertId: newUser.id });
        } else if (sql.includes('SELECT * FROM users WHERE email')) {
            const user = mockDb.users.find(u => u.email === params[0]);
            callback(null, user ? [user] : []);
        } else if (sql.includes('SELECT * FROM users WHERE id')) {
            const user = mockDb.users.find(u => u.id === params[0]);
            callback(null, user ? [user] : []);
        } else {
            callback(null, []);
        }
    }, 100);
};

// Initialize database connection and setup
let isUsingMockDb = false;

const initializeDatabase = async () => {
    const connected = await connectDatabase();
    if (!connected) {
        isUsingMockDb = true;
        db.query = mockQuery;
    }
};

// Initialize on module load
initializeDatabase();

module.exports = { 
    app, 
    db, 
    mockDb, 
    isUsingMockDb: () => isUsingMockDb 
};

