# Football Field Booking API

Backend API for the Football Field Booking Application.

## Tech Stack
- **Node.js** & **Express**
- **MySQL** & **Sequelize**
- **JWT** Authentication
- **Express Validator** for input validation
- **Express Rate Limit** for security
- **Helmet** for security headers
- **Compression** for performance

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── fieldController.js
│   │   ├── bookingController.js
│   │   ├── teamController.js
│   │   ├── teamMemberController.js
│   │   ├── matchResultController.js
│   │   ├── notificationController.js
│   │   ├── ratingController.js
│   │   └── dashboardController.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── fieldRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── teamMemberRoutes.js
│   │   ├── matchResultRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── ratingRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── models/              # Sequelize models
│   ├── config/              # Configuration files
│   │   ├── config.js
│   │   └── serverConfig.js
│   └── utils/               # Utility functions
├── server.js                # Main server file
├── package.json
└── README.md
```

## Setup

1. **Install Dependencies:**
    ```bash
    npm install
    ```

2. **Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    # Server Configuration
    NODE_ENV=development
    PORT=5000
    
    # Database Configuration
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=your_mysql_user
    DB_PASSWORD=your_mysql_password
    DB_NAME=football_booking
    
    # JWT Configuration
    JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
    JWT_EXPIRES_IN=7d
    
    # CORS Configuration
    CORS_ORIGIN=http://localhost:3000,http://localhost:3001
    
    # Security Configuration
    RATE_LIMITING=true
    LOG_LEVEL=dev
    
    # File Upload Configuration
    MAX_FILE_SIZE=5242880
    ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
    UPLOAD_DESTINATION=uploads/
    ```

3. **Database Setup:**
    Ensure MySQL service is running and create the database:
    ```sql
    CREATE DATABASE football_booking;
    ```

4. **Run Server:**
    ```bash
    npm run dev
    ```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)

### Users
- `GET /api/users` - List all users (Protected)
- `GET /api/users/:id` - Get user details (Protected)

### Fields
- `GET /api/fields` - List all fields
- `GET /api/fields/:id` - Get field details
- `POST /api/fields` - Create a field (Admin/Owner)
- `PUT /api/fields/:id` - Update a field (Admin/Owner)
- `DELETE /api/fields/:id` - Delete a field (Admin/Owner)

### Bookings
- `GET /api/bookings` - List bookings (Protected)
- `GET /api/bookings/:id` - Get booking details (Protected)
- `POST /api/bookings` - Create a booking (Player/Captain)
- `PUT /api/bookings/:id` - Update booking status (Protected)

### Teams
- `GET /api/teams` - List all teams (Protected)
- `GET /api/teams/:id` - Get team details (Protected)
- `POST /api/teams` - Create a team (Protected)

### Team Members
- `GET /api/team-members` - List team members (Protected)
- `POST /api/team-members` - Create team member (Protected)

### Match Results
- `GET /api/match-results` - List match results (Protected)
- `GET /api/match-results/:id` - Get match result details (Protected)
- `POST /api/match-results` - Create match result (Protected)

### Notifications
- `GET /api/notifications` - List notifications (Protected)
- `GET /api/notifications/:id` - Get notification details (Protected)
- `POST /api/notifications` - Create notification (Protected)

### Ratings
- `GET /api/ratings` - List ratings (Protected)
- `GET /api/ratings/:id` - Get rating details (Protected)
- `POST /api/ratings` - Create rating (Protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Protected)
- `GET /api/dashboard/search` - Search resources (Protected)

## Security Features

- **Input Validation**: All endpoints use express-validator for comprehensive input validation
- **Rate Limiting**: Different rate limits for different endpoint types
- **Security Headers**: Helmet middleware for security headers
- **CORS Protection**: Configurable CORS settings
- **JWT Authentication**: Secure token-based authentication
- **Error Handling**: Comprehensive error handling with custom error classes
- **Compression**: Response compression for better performance

## Error Handling

The API uses a standardized error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "submitted_value"
    }
  ]
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Search**: 30 requests per minute
- **Creation**: 10 requests per minute

## Roles
- **Guest**: View only.
- **Player**: Book fields, join teams.
- **Captain**: Manage team, book fields.
- **Field Owner**: Manage fields, view bookings.
- **Admin**: Full access.

## Environment Variables

### Required
- `NODE_ENV`: Application environment (development/test/production)
- `PORT`: Server port
- `JWT_SECRET`: JWT secret key (minimum 32 characters)
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password

### Optional
- `DB_PORT`: Database port (default: 3306)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 7d)
- `CORS_ORIGIN`: Allowed CORS origins
- `RATE_LIMITING`: Enable/disable rate limiting (default: true)
- `LOG_LEVEL`: Logging level (dev/combined)
- `MAX_FILE_SIZE`: Maximum file upload size
- `ALLOWED_FILE_TYPES`: Allowed file types for upload
- `UPLOAD_DESTINATION`: File upload directory
