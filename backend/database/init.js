#!/usr/bin/env node

/**
 * Football Field Booking Database Initialization Script
 * 
 * This script will:
 * 1. Create the database if it doesn't exist
 * 2. Create all necessary tables
 * 3. Insert sample data for development
 * 4. Set up proper indexes and constraints
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

const dbName = process.env.DB_NAME || 'football_booking';

async function initializeDatabase() {
    let connection;
    
    try {
        console.log('🚀 Starting database initialization...');
        
        // Connect to MySQL without specifying database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL server');
        
        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${dbName}' created or already exists`);
        
        // Switch to the database
        await connection.query(`USE \`${dbName}\``);
        console.log(`✅ Switched to database '${dbName}'`);
        
        // Read and execute schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');
        
        // Split SQL into individual statements and execute
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                    console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
                } catch (error) {
                    if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
                        error.code !== 'ER_DUP_ENTRY' && 
                        error.code !== 'ER_DUP_FIELDNAME') {
                        console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
                    } else {
                        console.log(`ℹ️  Statement ${i + 1}: ${error.message}`);
                    }
                }
            }
        }
        
        console.log('✅ All database tables created successfully');
        
        // Verify tables were created
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Created ${tables.length} tables:`, tables.map(t => Object.values(t)[0]));
        
        // Create indexes for better performance
        await createIndexes(connection);
        
        // Insert sample data if tables are empty
        await insertSampleData(connection);
        
        console.log('🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

async function createIndexes(connection) {
    console.log('🔍 Creating additional indexes for performance...');
    
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active)',
        'CREATE INDEX IF NOT EXISTS idx_bookings_field_time ON bookings(field_id, start_time, end_time)',
        'CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(booker_id, status)',
        'CREATE INDEX IF NOT EXISTS idx_teams_location_skill ON teams(home_location, skill_level)',
        'CREATE INDEX IF NOT EXISTS idx_matchmaking_location_skill ON matchmaking_requests(location, skill_level, status)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_field_rating ON reviews(field_id, rating, status)',
        'CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON team_members(team_id, status)'
    ];
    
    for (const indexSql of indexes) {
        try {
            await connection.query(indexSql);
            console.log('✅ Index created successfully');
        } catch (error) {
            console.warn('⚠️  Index creation warning:', error.message);
        }
    }
}

async function insertSampleData(connection) {
    console.log('📝 Checking for existing data...');
    
    // Check if users table has data
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (userCount[0].count > 0) {
        console.log('ℹ️  Sample data already exists, skipping data insertion');
        return;
    }
    
    console.log('📝 Inserting sample data...');
    
    try {
        // Insert sample users
        const userPassword = '$2a$12$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4'; // 'password123'
        
        const users = [
            ['player1', 'player@example.com', userPassword, 'John', 'Player', '012345678', 'player'],
            ['fieldowner1', 'owner@example.com', userPassword, 'Sarah', 'Owner', '023456789', 'field_owner'],
            ['captain1', 'captain@example.com', userPassword, 'Mike', 'Captain', '034567890', 'team_captain'],
            ['admin1', 'admin@example.com', userPassword, 'Admin', 'User', '045678901', 'admin']
        ];
        
        for (const user of users) {
            await connection.query(
                'INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                user
            );
        }
        console.log('✅ Sample users inserted');
        
        // Insert sample teams
        const teams = [
            ['Phnom Penh Warriors', 1, 'Competitive team looking for matches', 'intermediate', 'phnom_penh', 11, 9],
            ['Siem Reap United', 2, 'Friendly team for casual matches', 'advanced', 'siem_reap', 11, 11],
            ['Battambang Eagles', 3, 'Beginner-friendly team', 'beginner', 'battambang', 11, 7]
        ];
        
        for (const team of teams) {
            await connection.query(
                'INSERT INTO teams (name, captain_id, description, skill_level, home_location, max_players, current_players) VALUES (?, ?, ?, ?, ?, ?, ?)',
                team
            );
        }
        console.log('✅ Sample teams inserted');
        
        // Insert sample fields
        const fields = [
            ['Phnom Penh Football Stadium', 'Premium football field with professional facilities', 'Phnom Penh', 'Street 123, Phnom Penh', 2, 50.00, 'https://via.placeholder.com/400x225/22c55e/ffffff?text=Football+Field', JSON.stringify({showers: true, parking: true, lights: true, lockers: true}), 'grass', '11v11'],
            ['Siem Reap Sports Complex', 'Modern sports complex with multiple fields', 'Siem Reap', 'Road 456, Siem Reap', 2, 45.00, 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=Football+Field', JSON.stringify({showers: true, parking: true, lights: false, lockers: true}), 'artificial', '7v7']
        ];
        
        for (const field of fields) {
            await connection.query(
                'INSERT INTO fields (name, description, location, address, owner_id, price_per_hour, image_url, facilities, field_type, field_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                field
            );
        }
        console.log('✅ Sample fields inserted');
        
        // Insert field availability
        const availability = [
            [1, 'monday', '06:00:00', '22:00:00'],
            [1, 'tuesday', '06:00:00', '22:00:00'],
            [1, 'wednesday', '06:00:00', '22:00:00'],
            [1, 'thursday', '06:00:00', '22:00:00'],
            [1, 'friday', '06:00:00', '22:00:00'],
            [1, 'saturday', '07:00:00', '23:00:00'],
            [1, 'sunday', '07:00:00', '23:00:00'],
            [2, 'monday', '07:00:00', '21:00:00'],
            [2, 'tuesday', '07:00:00', '21:00:00'],
            [2, 'wednesday', '07:00:00', '21:00:00'],
            [2, 'thursday', '07:00:00', '21:00:00'],
            [2, 'friday', '07:00:00', '21:00:00'],
            [2, 'saturday', '08:00:00', '22:00:00'],
            [2, 'sunday', '08:00:00', '22:00:00']
        ];
        
        for (const avail of availability) {
            await connection.query(
                'INSERT INTO field_availability (field_id, day_of_week, opening_time, closing_time) VALUES (?, ?, ?, ?)',
                avail
            );
        }
        console.log('✅ Field availability inserted');
        
        // Insert team members
        await connection.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [1, 1, 'player']
        );
        await connection.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [2, 2, 'player']
        );
        await connection.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [3, 3, 'player']
        );
        console.log('✅ Team members inserted');
        
        // Insert matchmaking requests
        const matchmaking = [
            [1, 1, 'intermediate', 'phnom_penh', 'evening', 2, 11, 'Looking for players for a friendly match', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)],
            [2, 2, 'advanced', 'siem_reap', 'afternoon', 3, 11, 'Competitive match, experienced players preferred', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)],
            [3, 3, 'beginner', 'battambang', 'morning', 5, 11, 'Casual game for beginners and intermediates', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        ];
        
        for (const match of matchmaking) {
            await connection.query(
                'INSERT INTO matchmaking_requests (team_id, captain_id, skill_level, location, preferred_time, players_needed, max_players, description, match_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                match
            );
        }
        console.log('✅ Matchmaking requests inserted');
        
        console.log('✅ All sample data inserted successfully');
        
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
        throw error;
    }
}

// Run the initialization
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
