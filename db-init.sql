-- Initial database setup script
-- This script runs on first container startup

-- Create character set for better Unicode support
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- You can add additional initial setup here, such as:
-- Creating specific tables or loading seed data
-- Example: INSERT INTO users (email, password, role) VALUES (...);

USE football_booking_db;

-- Set timezone support (optional)
-- This helps with datetime consistency
SET time_zone = '+00:00';
