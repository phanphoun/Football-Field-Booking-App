# Football Field Booking Database Setup

This directory contains all the necessary files to set up and manage the MySQL database for the Football Field Booking application.

## 📁 Files Overview

- **`schema.sql`** - Complete database schema with all tables, indexes, and sample data
- **`queries.sql`** - Comprehensive SQL queries for all application operations
- **`init.js`** - Automated database initialization script
- **`README.md`** - This file (setup documentation)

## 🚀 Quick Setup

### Prerequisites
- MySQL 8.0+ installed and running
- Node.js 14+ installed
- Environment variables configured in `.env` file

### Environment Variables
Make sure your `.env` file contains:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=football_booking
```

### Setup Commands

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize database (automated):**
   ```bash
   npm run init-db
   ```

3. **Or run complete setup:**
   ```bash
   npm run setup
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Core Tables

#### Users
- User authentication and profiles
- Roles: player, field_owner, team_captain, admin
- Account status and verification tracking

#### Teams
- Team information and management
- Skill levels and location preferences
- Captain and member relationships

#### Fields
- Football field details
- Pricing, availability, and facilities
- Owner relationships and ratings

#### Bookings
- Field reservations and scheduling
- Payment tracking and status management
- Time conflict prevention

#### Matchmaking
- Team match requests and applications
- Skill level and location matching
- Communication between teams

#### Supporting Tables
- **team_members** - Team membership management
- **field_availability** - Operating hours by day
- **reviews** - Field ratings and feedback
- **notifications** - User notifications
- **user_sessions** - Authentication sessions
- **audit_log** - Change tracking and security

## 🔧 Manual Database Setup

If you prefer to set up the database manually:

1. **Create database:**
   ```sql
   CREATE DATABASE football_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import schema:**
   ```bash
   mysql -u root -p football_booking < database/schema.sql
   ```

3. **Verify setup:**
   ```sql
   USE football_booking;
   SHOW TABLES;
   ```

## 📝 Sample Data

The initialization script includes sample data for testing:

- **4 Users** (player, field_owner, team_captain, admin)
- **3 Teams** with different skill levels
- **2 Fields** with availability schedules
- **Team memberships** and **matchmaking requests**

## 🔍 Query Examples

### Find Available Fields
```sql
SELECT f.*, u.username as owner_name
FROM fields f
LEFT JOIN users u ON f.owner_id = u.id
WHERE f.status = 'available'
ORDER BY f.rating DESC;
```

### Check Field Availability
```sql
SELECT start_time, end_time, status
FROM bookings
WHERE field_id = 1
  AND status IN ('pending', 'confirmed')
  AND start_time BETWEEN '2024-02-25' AND '2024-02-26';
```

### Get User Bookings
```sql
SELECT b.*, f.name as field_name, t.name as team_name
FROM bookings b
LEFT JOIN fields f ON b.field_id = f.id
LEFT JOIN teams t ON b.team_id = t.id
WHERE b.booker_id = 1
ORDER BY b.start_time DESC;
```

## 🛠️ Maintenance

### Backup Database
```bash
mysqldump -u root -p football_booking > backup.sql
```

### Reset Database
```bash
npm run init-db
```

### Update Schema
```sql
-- Add new column
ALTER TABLE fields ADD COLUMN new_column VARCHAR(100);

-- Add new index
CREATE INDEX idx_new_index ON table_name(column_name);
```

## 🔐 Security Considerations

- All passwords are hashed using bcrypt (12 rounds)
- JWT tokens for authentication with 24-hour expiration
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- Audit logging for all important operations

## 📈 Performance Optimization

### Indexes Created
- User email and username lookups
- Booking time range queries
- Field location and price searches
- Team skill and location filtering
- Notification queries

### Query Optimization
- Use EXPLAIN to analyze slow queries
- Implement pagination for large result sets
- Cache frequently accessed data
- Use connection pooling in production

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused:**
   - Check MySQL service is running
   - Verify host and port in `.env`
   - Check firewall settings

2. **Access denied:**
   - Verify MySQL user credentials
   - Grant proper privileges:
   ```sql
   GRANT ALL PRIVILEGES ON football_booking.* TO 'user'@'localhost';
   ```

3. **Table doesn't exist:**
   - Run `npm run init-db`
   - Check database name in `.env`

4. **Duplicate entry errors:**
   - Check unique constraints in schema
   - Verify sample data isn't already inserted

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📞 Support

For database-related issues:
1. Check MySQL error logs
2. Review application logs
3. Verify environment configuration
4. Test with manual SQL queries

## 🔄 Version History

- **v1.0.0** - Initial database schema
- Complete user and team management
- Booking and matchmaking system
- Reviews and notifications
