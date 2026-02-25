-- Football Field Booking Database Schema
-- MySQL 8.0+

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS football_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE football_booking;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role ENUM('player', 'field_owner', 'team_captain', 'admin') DEFAULT 'player',
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    captain_id INT NOT NULL,
    description TEXT,
    skill_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    home_location ENUM('phnom_penh', 'siem_reap', 'battambang', 'other') NOT NULL,
    max_players INT NOT NULL DEFAULT 11,
    current_players INT DEFAULT 0,
    team_logo_url VARCHAR(255),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_captain_id (captain_id),
    INDEX idx_skill_level (skill_level),
    INDEX idx_home_location (home_location),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Team members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('player', 'assistant_captain') DEFAULT 'player',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'pending', 'removed') DEFAULT 'active',
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    address TEXT,
    owner_id INT,
    price_per_hour DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    facilities JSON,
    field_type ENUM('grass', 'artificial', 'indoor') DEFAULT 'grass',
    field_size ENUM('5v5', '7v7', '11v11') DEFAULT '11v11',
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    status ENUM('available', 'unavailable', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner_id (owner_id),
    INDEX idx_location (location),
    INDEX idx_price_per_hour (price_per_hour),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Field availability table
CREATE TABLE IF NOT EXISTS field_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    UNIQUE KEY unique_field_day (field_id, day_of_week),
    INDEX idx_field_id (field_id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    team_id INT NOT NULL,
    booker_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    special_requests TEXT,
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (booker_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_field_id (field_id),
    INDEX idx_team_id (team_id),
    INDEX idx_booker_id (booker_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    
    -- Prevent overlapping bookings for the same field
    CONSTRAINT check_booking_times CHECK (end_time > start_time)
);

-- Matchmaking requests table
CREATE TABLE IF NOT EXISTS matchmaking_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    captain_id INT NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    location ENUM('phnom_penh', 'siem_reap', 'battambang', 'other') NOT NULL,
    preferred_time ENUM('morning', 'afternoon', 'evening') NOT NULL,
    players_needed INT NOT NULL,
    max_players INT NOT NULL DEFAULT 11,
    description TEXT,
    match_date DATE,
    status ENUM('active', 'matched', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_team_id (team_id),
    INDEX idx_captain_id (captain_id),
    INDEX idx_skill_level (skill_level),
    INDEX idx_location (location),
    INDEX idx_preferred_time (preferred_time),
    INDEX idx_status (status),
    INDEX idx_match_date (match_date),
    INDEX idx_created_at (created_at)
);

-- Match applications table
CREATE TABLE IF NOT EXISTS match_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matchmaking_request_id INT NOT NULL,
    team_id INT NOT NULL,
    applicant_id INT NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (matchmaking_request_id) REFERENCES matchmaking_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_matchmaking_request_id (matchmaking_request_id),
    INDEX idx_team_id (team_id),
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_status (status),
    INDEX idx_applied_at (applied_at)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    booking_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('published', 'hidden', 'flagged') DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    
    INDEX idx_field_id (field_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Ensure one review per user per field
    UNIQUE KEY unique_user_field_review (reviewer_id, field_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'matchmaking', 'team', 'system') NOT NULL,
    related_id INT, -- Can be booking_id, team_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- Audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_created_at (created_at)
);

-- Insert sample data for testing
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role) VALUES
('player1', 'player@example.com', '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4', 'John', 'Player', '012345678', 'player'),
('fieldowner1', 'owner@example.com', '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4', 'Sarah', 'Owner', '023456789', 'field_owner'),
('captain1', 'captain@example.com', '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4', 'Mike', 'Captain', '034567890', 'team_captain'),
('admin1', 'admin@example.com', '$2a$10$rQZ8kHWKtGY5uKx4vJ2O9Oa8jG9wX3mY1Z2bC7dE8fA9bC0dE1f2g3h4', 'Admin', 'User', '045678901', 'admin');

INSERT INTO teams (name, captain_id, description, skill_level, home_location, max_players, current_players) VALUES
('Phnom Penh Warriors', 1, 'Competitive team looking for matches', 'intermediate', 'phnom_penh', 11, 9),
('Siem Reap United', 2, 'Friendly team for casual matches', 'advanced', 'siem_reap', 11, 11),
('Battambang Eagles', 3, 'Beginner-friendly team', 'beginner', 'battambang', 11, 7);

INSERT INTO fields (name, description, location, address, owner_id, price_per_hour, image_url, facilities, field_type, field_size, rating, review_count) VALUES
('Phnom Penh Football Stadium', 'Premium football field with professional facilities', 'Phnom Penh', 'Street 123, Phnom Penh', 2, 50.00, 'https://via.placeholder.com/400x225/22c55e/ffffff?text=Football+Field', JSON_OBJECT('showers', true, 'parking', true, 'lights', true, 'lockers', true), 'grass', '11v11', 4.5, 128),
('Siem Reap Sports Complex', 'Modern sports complex with multiple fields', 'Siem Reap', 'Road 456, Siem Reap', 2, 45.00, 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=Football+Field', JSON_OBJECT('showers', true, 'parking', true, 'lights', false, 'lockers', true), 'artificial', '7v7', 4.3, 89);

-- Insert field availability
INSERT INTO field_availability (field_id, day_of_week, opening_time, closing_time) VALUES
(1, 'monday', '06:00:00', '22:00:00'),
(1, 'tuesday', '06:00:00', '22:00:00'),
(1, 'wednesday', '06:00:00', '22:00:00'),
(1, 'thursday', '06:00:00', '22:00:00'),
(1, 'friday', '06:00:00', '22:00:00'),
(1, 'saturday', '07:00:00', '23:00:00'),
(1, 'sunday', '07:00:00', '23:00:00'),
(2, 'monday', '07:00:00', '21:00:00'),
(2, 'tuesday', '07:00:00', '21:00:00'),
(2, 'wednesday', '07:00:00', '21:00:00'),
(2, 'thursday', '07:00:00', '21:00:00'),
(2, 'friday', '07:00:00', '21:00:00'),
(2, 'saturday', '08:00:00', '22:00:00'),
(2, 'sunday', '08:00:00', '22:00:00');

-- Insert team members
INSERT INTO team_members (team_id, user_id, role) VALUES
(1, 1, 'player'),
(2, 2, 'player'),
(3, 3, 'player');

-- Insert matchmaking requests
INSERT INTO matchmaking_requests (team_id, captain_id, skill_level, location, preferred_time, players_needed, max_players, description, match_date) VALUES
(1, 1, 'intermediate', 'phnom_penh', 'evening', 2, 11, 'Looking for players for a friendly match', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)),
(2, 2, 'advanced', 'siem_reap', 'afternoon', 3, 11, 'Competitive match, experienced players preferred', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY)),
(3, 3, 'beginner', 'battambang', 'morning', 5, 11, 'Casual game for beginners and intermediates', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY));
