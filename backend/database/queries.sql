-- Football Field Booking Application - SQL Queries
-- Complete set of queries for all operations

-- ============================================
-- USER QUERIES
-- ============================================

-- User Registration
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role) 
VALUES (?, ?, ?, ?, ?, ?, ?);

-- User Login - Get user by email or username
SELECT id, username, email, password_hash, first_name, last_name, role, is_active 
FROM users 
WHERE email = ? OR username = ? 
AND is_active = TRUE;

-- Get User Profile
SELECT id, username, email, first_name, last_name, phone, role, avatar_url, 
       is_active, email_verified, last_login, created_at
FROM users 
WHERE id = ?;

-- Update User Profile
UPDATE users 
SET first_name = ?, last_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Update Last Login
UPDATE users 
SET last_login = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Change Password
UPDATE users 
SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Get All Users (Admin only)
SELECT id, username, email, first_name, last_name, role, is_active, 
       email_verified, last_login, created_at
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- TEAM QUERIES
-- ============================================

-- Get All Teams
SELECT t.*, u.username as captain_name, u.first_name as captain_first_name, u.last_name as captain_last_name
FROM teams t
LEFT JOIN users u ON t.captain_id = u.id
WHERE t.status = 'active'
ORDER BY t.created_at DESC;

-- Get Team by ID
SELECT t.*, u.username as captain_name, u.first_name as captain_first_name, u.last_name as captain_last_name
FROM teams t
LEFT JOIN users u ON t.captain_id = u.id
WHERE t.id = ? AND t.status = 'active';

-- Create Team
INSERT INTO teams (name, captain_id, description, skill_level, home_location, max_players, current_players, team_logo_url)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Update Team
UPDATE teams 
SET name = ?, description = ?, skill_level = ?, home_location = ?, 
    max_players = ?, team_logo_url = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND captain_id = ?;

-- Delete Team (Soft delete)
UPDATE teams 
SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
WHERE id = ? AND captain_id = ?;

-- Get Teams by User (teams user is member of)
SELECT t.*, tm.role as member_role, tm.joined_at
FROM teams t
INNER JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = ? AND tm.status = 'active' AND t.status = 'active'
ORDER BY tm.joined_at DESC;

-- Get Team Members
SELECT u.id, u.username, u.first_name, u.last_name, u.email, u.phone, 
       tm.role as member_role, tm.joined_at
FROM users u
INNER JOIN team_members tm ON u.id = tm.user_id
WHERE tm.team_id = ? AND tm.status = 'active'
ORDER BY tm.joined_at ASC;

-- Add Team Member
INSERT INTO team_members (team_id, user_id, role)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE status = 'active', joined_at = CURRENT_TIMESTAMP;

-- Remove Team Member
UPDATE team_members 
SET status = 'removed'
WHERE team_id = ? AND user_id = ?;

-- Update Team Player Count
UPDATE teams 
SET current_players = (
    SELECT COUNT(*) 
    FROM team_members 
    WHERE team_id = teams.id AND status = 'active'
)
WHERE id = ?;

-- ============================================
-- FIELD QUERIES
-- ============================================

-- Get All Fields
SELECT f.*, u.username as owner_name, u.first_name as owner_first_name, u.last_name as owner_last_name
FROM fields f
LEFT JOIN users u ON f.owner_id = u.id
WHERE f.status = 'available'
ORDER BY f.rating DESC, f.created_at DESC;

-- Get Field by ID
SELECT f.*, u.username as owner_name, u.first_name as owner_first_name, u.last_name as owner_last_name
FROM fields f
LEFT JOIN users u ON f.owner_id = u.id
WHERE f.id = ? AND f.status = 'available';

-- Create Field
INSERT INTO fields (name, description, location, address, owner_id, price_per_hour, image_url, facilities, field_type, field_size)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Update Field
UPDATE fields 
SET name = ?, description = ?, location = ?, address = ?, price_per_hour = ?, 
    image_url = ?, facilities = ?, field_type = ?, field_size = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND owner_id = ?;

-- Get Field Availability
SELECT day_of_week, opening_time, closing_time, is_available
FROM field_availability
WHERE field_id = ?
ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Search Fields by Location and Filters
SELECT f.*, u.username as owner_name
FROM fields f
LEFT JOIN users u ON f.owner_id = u.id
WHERE f.status = 'available'
  AND (? IS NULL OR f.location = ?)
  AND (? IS NULL OR f.price_per_hour <= ?)
  AND (? IS NULL OR f.field_type = ?)
  AND (? IS NULL OR f.field_size = ?)
ORDER BY f.rating DESC, f.price_per_hour ASC;

-- ============================================
-- BOOKING QUERIES
-- ============================================

-- Get User Bookings
SELECT b.*, f.name as field_name, f.location as field_location, f.address as field_address,
       t.name as team_name, u.username as booker_name
FROM bookings b
LEFT JOIN fields f ON b.field_id = f.id
LEFT JOIN teams t ON b.team_id = t.id
LEFT JOIN users u ON b.booker_id = u.id
WHERE b.booker_id = ? OR b.team_id IN (
    SELECT team_id FROM team_members WHERE user_id = ? AND status = 'active'
)
ORDER BY b.start_time DESC;

-- Get Field Bookings (for availability check)
SELECT id, start_time, end_time, status
FROM bookings
WHERE field_id = ? 
  AND status IN ('pending', 'confirmed')
  AND (
    (start_time <= ? AND end_time > ?) 
    OR (start_time < ? AND end_time >= ?)
    OR (start_time >= ? AND end_time <= ?)
  )
ORDER BY start_time ASC;

-- Create Booking
INSERT INTO bookings (field_id, team_id, booker_id, start_time, end_time, total_price, special_requests)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Update Booking Status
UPDATE bookings 
SET status = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND (booker_id = ? OR team_id IN (
    SELECT team_id FROM team_members WHERE user_id = ? AND status = 'active'
));

-- Update Payment Status
UPDATE bookings 
SET payment_status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Get Booking by ID
SELECT b.*, f.name as field_name, f.location as field_location,
       t.name as team_name, u.username as booker_name
FROM bookings b
LEFT JOIN fields f ON b.field_id = f.id
LEFT JOIN teams t ON b.team_id = t.id
LEFT JOIN users u ON b.booker_id = u.id
WHERE b.id = ?;

-- ============================================
-- MATCHMAKING QUERIES
-- ============================================

-- Get Available Matches
SELECT mr.*, t.name as team_name, u.username as captain_name, 
       u.first_name as captain_first_name, u.last_name as captain_last_name
FROM matchmaking_requests mr
INNER JOIN teams t ON mr.team_id = t.id
INNER JOIN users u ON mr.captain_id = u.id
WHERE mr.status = 'active'
  AND (? IS NULL OR mr.location = ?)
  AND (? IS NULL OR mr.skill_level = ?)
  AND (? IS NULL OR mr.preferred_time = ?)
ORDER BY mr.created_at DESC;

-- Create Matchmaking Request
INSERT INTO matchmaking_requests (team_id, captain_id, skill_level, location, preferred_time, players_needed, max_players, description, match_date)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Get Matchmaking Applications
SELECT ma.*, t.name as applicant_team_name, u.username as applicant_name
FROM match_applications ma
INNER JOIN teams t ON ma.team_id = t.id
INNER JOIN users u ON ma.applicant_id = u.id
WHERE ma.matchmaking_request_id = ?
ORDER BY ma.applied_at DESC;

-- Apply to Match
INSERT INTO match_applications (matchmaking_request_id, team_id, applicant_id, message)
VALUES (?, ?, ?, ?);

-- Update Match Application Status
UPDATE match_applications 
SET status = ?
WHERE id = ? AND matchmaking_request_id IN (
    SELECT id FROM matchmaking_requests WHERE captain_id = ?
);

-- Update Match Request Status
UPDATE matchmaking_requests 
SET status = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND captain_id = ?;

-- ============================================
-- REVIEW QUERIES
-- ============================================

-- Get Field Reviews
SELECT r.*, u.username as reviewer_name, u.first_name as reviewer_first_name, 
       u.last_name as reviewer_last_name, b.start_time as booking_date
FROM reviews r
INNER JOIN users u ON r.reviewer_id = u.id
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE r.field_id = ? AND r.status = 'published'
ORDER BY r.created_at DESC;

-- Create Review
INSERT INTO reviews (field_id, reviewer_id, booking_id, rating, comment)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP;

-- Update Field Rating
UPDATE fields 
SET rating = (
    SELECT COALESCE(AVG(rating), 0) 
    FROM reviews 
    WHERE field_id = fields.id AND status = 'published'
),
review_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE field_id = fields.id AND status = 'published'
),
updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- ============================================
-- NOTIFICATION QUERIES
-- ============================================

-- Get User Notifications
SELECT id, title, message, type, related_id, is_read, created_at
FROM notifications
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 50;

-- Create Notification
INSERT INTO notifications (user_id, title, message, type, related_id)
VALUES (?, ?, ?, ?, ?);

-- Mark Notification as Read
UPDATE notifications 
SET is_read = TRUE
WHERE id = ? AND user_id = ?;

-- Get Unread Notification Count
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = ? AND is_read = FALSE;

-- ============================================
-- SESSION QUERIES
-- ============================================

-- Create User Session
INSERT INTO user_sessions (user_id, token_hash, device_info, ip_address, expires_at)
VALUES (?, ?, ?, ?, ?);

-- Get User Session
SELECT s.*, u.username, u.role
FROM user_sessions s
INNER JOIN users u ON s.user_id = u.id
WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = TRUE;

-- Delete User Session (Logout)
DELETE FROM user_sessions 
WHERE token_hash = ? AND user_id = ?;

-- Clean Expired Sessions
DELETE FROM user_sessions 
WHERE expires_at <= CURRENT_TIMESTAMP;

-- ============================================
-- AUDIT LOG QUERIES
-- ============================================

-- Create Audit Log Entry
INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Get User Activity Log
SELECT action, table_name, record_id, created_at
FROM audit_log
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- REPORTING QUERIES
-- ============================================

-- Get Booking Statistics (for field owners)
SELECT 
    DATE(start_time) as booking_date,
    COUNT(*) as total_bookings,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_booking_price
FROM bookings
WHERE field_id = ? AND status = 'completed'
  AND start_time >= ? AND start_time <= ?
GROUP BY DATE(start_time)
ORDER BY booking_date DESC;

-- Get Popular Fields
SELECT 
    f.id, f.name, f.location, f.rating, f.review_count,
    COUNT(b.id) as total_bookings,
    SUM(b.total_price) as total_revenue
FROM fields f
LEFT JOIN bookings b ON f.id = b.field_id AND b.status = 'completed'
WHERE f.status = 'available'
GROUP BY f.id, f.name, f.location, f.rating, f.review_count
ORDER BY total_bookings DESC, total_revenue DESC;

-- Get User Activity Summary
SELECT 
    u.id, u.username, u.first_name, u.last_name,
    COUNT(DISTINCT tm.team_id) as teams_count,
    COUNT(DISTINCT b.id) as bookings_count,
    SUM(b.total_price) as total_spent
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.status = 'active'
LEFT JOIN bookings b ON u.id = b.booker_id AND b.status = 'completed'
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, u.first_name, u.last_name
ORDER BY total_spent DESC;

-- ============================================
-- SEARCH AND FILTERING QUERIES
-- ============================================

-- Advanced Field Search
SELECT f.*, u.username as owner_name,
       (SELECT AVG(rating) FROM reviews WHERE field_id = f.id AND status = 'published') as avg_rating,
       (SELECT COUNT(*) FROM reviews WHERE field_id = f.id AND status = 'published') as review_count,
       (SELECT COUNT(*) FROM bookings WHERE field_id = f.id AND status = 'completed') as booking_count
FROM fields f
LEFT JOIN users u ON f.owner_id = u.id
WHERE f.status = 'available'
  AND (? IS NULL OR f.name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR f.location = ?)
  AND (? IS NULL OR f.price_per_hour BETWEEN ? AND ?)
  AND (? IS NULL OR f.field_type = ?)
  AND (? IS NULL OR f.field_size = ?)
  AND (? IS NULL OR f.rating >= ?)
ORDER BY 
    CASE 
        WHEN ? = 'price_low' THEN f.price_per_hour
        WHEN ? = 'price_high' THEN -f.price_per_hour
        WHEN ? = 'rating' THEN f.rating
        WHEN ? = 'bookings' THEN (SELECT COUNT(*) FROM bookings WHERE field_id = f.id)
        ELSE f.created_at
    END ASC;

-- Team Search
SELECT t.*, u.username as captain_name,
       (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND status = 'active') as member_count
FROM teams t
INNER JOIN users u ON t.captain_id = u.id
WHERE t.status = 'active'
  AND (? IS NULL OR t.name LIKE CONCAT('%', ?, '%'))
  AND (? IS NULL OR t.skill_level = ?)
  AND (? IS NULL OR t.home_location = ?)
  AND (? IS NULL OR t.current_players < t.max_players)
ORDER BY t.created_at DESC;
