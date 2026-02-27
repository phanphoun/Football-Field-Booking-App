# Football Field Booking App

A comprehensive web application for booking football fields and organizing matches in Cambodia, connecting teams, field owners, and football enthusiasts.

## 📋 Project Overview

The Football Field Booking App serves as a centralized platform that bridges field owners and football teams, offering streamlined booking management, automatic opponent matchmaking, and community engagement features.

## 🎯 Key Features

### For Players & Teams
- **Field Booking**: Browse and book available football fields
- **Matchmaking**: Find opponents for matches automatically
- **Team Management**: Create and manage team profiles, logos, and members
- **Match History**: Track performance, statistics, and rankings
- **Jersey Selection**: Choose team colors with conflict detection

### For Field Owners
- **Field Management**: Add and manage multiple field locations
- **Schedule Control**: Set operating hours, pricing, and availability
- **Booking Management**: Confirm, cancel, and modify bookings
- **Match Results**: Record scores and select MVPs
- **Revenue Tracking**: Monitor field utilization and earnings

### For Football Fans
- **League Updates**: Follow English, Spanish, Italian, and Champions League matches
- **Live Scores**: Real-time match results and standings
- **Top Scorers**: Track leading goal scorers across leagues

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Guest** | View fields, schedules, league matches |
| **Player/Team Captain** | Register teams, book fields, join matches, manage team members |
| **Field Owner/Admin** | Create fields, manage schedules, confirm bookings, set pricing |

## 🏗️ Technology Stack

### **Backend**
- **Node.js 24.11.1** - JavaScript runtime environment
- **Express.js 5.2.1** - Fast, minimalist web framework
- **MySQL/MariaDB 10.4.32** - Relational database
- **Sequelize 6.37.7** - ORM for database management
- **JWT 9.0.3** - Authentication tokens
- **bcryptjs 3.0.3** - Password hashing
- **Helmet 8.1.0** - Security headers
- **CORS 2.8.6** - Cross-origin resource sharing

### **Frontend**
- **React 19.2.0** - Modern UI library
- **Vite 7.3.1** - Fast build tool and dev server
- **React Router DOM 7.13.0** - Client-side routing
- **Axios 1.13.5** - HTTP client
- **Lucide React 0.564.0** - Icon library
- **Tailwind CSS** - Utility-first CSS framework

### **Development Tools**
- **ESLint 9.39.1** - Code linting
- **Postman** - API testing
- **Git** - Version control
- **npm** - Package management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL/MariaDB (v8.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/phanphoun/Football-Field-Booking-App.git
   cd Football-Field-Booking-App
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE football_booking;
   ```

4. **Environment Configuration**
   ```bash
   # Backend environment variables (already configured)
   cd backend
   # .env file contains database credentials and JWT secret
   
   # Frontend environment variables
   cd ../frontend
   # Configure API endpoints in your components
   ```

5. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend (in new terminal)
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/

## 📊 Database Schema

### Core Tables

#### **Users**
- Authentication and profile management
- Roles: guest, player, captain, field_owner, admin
- Fields: username, email, password, firstName, lastName, phone, role, status

#### **Fields**
- Football field information and management
- Fields: name, description, address, pricePerHour, capacity, surfaceType, amenities
- Relationships: Owner (User), Bookings

#### **Teams**
- Team details and configuration
- Fields: name, description, captainId, maxPlayers, status, logoUrl
- Relationships: Captain (User), Players (Users), Bookings

#### **Bookings**
- Field reservation records and scheduling
- Fields: startTime, endTime, totalPrice, status, notes
- Relationships: Field, Team, Creator (User)

#### **Team Members**
- Many-to-many relationship between users and teams
- Fields: role, status, joinedAt, isActive
- Relationships: Team, User

#### **Match Results**
- Game outcomes and performance tracking
- Fields: homeScore, awayScore, matchStatus, mvpPlayerId
- Relationships: Booking, Teams, MVP Player

#### **Notifications**
- Real-time alerts and user communication
- Fields: title, message, type, isRead
- Relationships: User

#### **Ratings**
- Team reviews and community feedback
- Fields: rating, comment, ratingType
- Relationships: Teams, Booking

## 🔐 Security Features

- **JWT Authentication** - Secure token-based API access
- **Role-Based Access Control** - Strict permission enforcement
- **Password Encryption** - bcrypt hashing for password security
- **Helmet.js** - Security headers protection
- **Input Validation** - Request body validation and sanitization
- **CORS Configuration** - Controlled cross-origin access

## 🌐 API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Profile (Protected)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Fields (Protected)
- `GET /api/fields` - List all fields
- `GET /api/fields/:id` - Get field details
- `POST /api/fields` - Create new field

### Bookings (Protected)
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create new booking

### Teams (Protected)
- `GET /api/teams` - List teams
- `GET /api/teams/:id` - Get team details
- `POST /api/teams` - Create new team

### Team Members (Protected)
- `GET /api/team-members` - List team members
- `POST /api/team-members` - Add team member

### Match Results (Protected)
- `GET /api/match-results` - List match results
- `GET /api/match-results/:id` - Get match result details
- `POST /api/match-results` - Create match result

### Notifications (Protected)
- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get notification details
- `POST /api/notifications` - Create notification

### Ratings (Protected)
- `GET /api/ratings` - List ratings
- `GET /api/ratings/:id` - Get rating details
- `POST /api/ratings` - Create rating

### Utilities (Protected)
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/search` - Search across resources

## 📝 API Usage Examples

### Register a User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create a Field (with Authentication)
```bash
POST http://localhost:5000/api/fields
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "name": "Green Field Football Stadium",
  "description": "Professional football field with premium grass",
  "address": "123 Sports Street, Phnom Penh",
  "pricePerHour": 50,
  "capacity": 22,
  "surfaceType": "grass",
  "hasLighting": true,
  "hasChangingRoom": true,
  "hasParking": true
}
```

## 🧪 Testing

### Manual Testing with Postman
1. Import the provided Postman collection
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token from login
3. Test endpoints in order:
   - Register user
   - Login to get token
   - Create resources using token

### Database Testing
```bash
# Test database connection
cd backend
node -e "const { sequelize } = require('./src/models'); sequelize.authenticate().then(() => console.log('✅ Connected')).catch(err => console.error('❌ Failed:', err.message));"
```

## 📦 Project Structure

```
Football-Field-Booking-App/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Authentication and validation
│   │   ├── config/          # Database configuration
│   │   └── utils/           # Helper functions
│   ├── .env                 # Environment variables
│   ├── package.json         # Dependencies
│   └── server.js            # Main application file
├── frontend/
│   ├── public/              # Static assets
│   ├── src/                # React components
│   ├── package.json        # Dependencies
│   └── vite.config.js      # Build configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 Development Workflow

### Making Changes
1. Make code changes
2. Test with Postman
3. Commit changes with descriptive messages
4. Push to GitHub

### Code Quality
- Use ESLint for code formatting
- Follow RESTful API conventions
- Write meaningful commit messages
- Test all endpoints before deployment

## 🚀 Deployment

### Production Setup
1. Configure production environment variables
2. Build frontend: `npm run build`
3. Start backend with process manager (PM2)
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates

### Environment Variables
```bash
# Backend .env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=football_booking
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines
- Use ESLint for JavaScript linting
- Follow RESTful API conventions
- Write meaningful commit messages
- Test all endpoints before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Development Team

- **Backend Developer**: Phan Phoun
- **Database Design**: Phan Phoun
- **API Documentation**: Phan Phoun

## 📞 Support

For support and inquiries:
- **GitHub Issues**: [Create an issue](https://github.com/phanphoun/Football-Field-Booking-App/issues)
- **Email**: phanphoun@example.com

## 🗺️ Roadmap

### Phase 1 (Current Release ✅)
- [x] Basic field booking system
- [x] User authentication and roles
- [x] Team management
- [x] Match results tracking
- [x] JWT authentication
- [x] RESTful API

### Phase 2 (Future Release)
- [ ] Frontend React application
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Mobile applications (iOS/Android)

### Phase 3 (Long-term)
- [ ] AI-powered team recommendations
- [ ] Virtual field tours
- [ ] Tournament organization features
- [ ] Live streaming capabilities

## 📊 Current Status

- ✅ **Backend API**: Complete with authentication and CRUD operations
- ✅ **Database**: Fully designed and implemented with Sequelize
- ✅ **Authentication**: JWT-based with role-based access control
- ✅ **API Documentation**: Comprehensive endpoint documentation
- 🔄 **Frontend**: Basic React setup (in development)

---

**Built with ❤️ for the Cambodian football community**