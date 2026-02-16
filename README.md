# Football Field Booking App

A comprehensive web application for booking football fields and organizing matches in Cambodia, connecting teams, field owners, and football enthusiasts.

## 📋 Project Overview

The Football Field Booking App serves as a centralized platform that bridges field owners and football teams, offering streamlined booking management, automatic opponent matchmaking, and community engagement features. The application also keeps fans engaged with updates from major European leagues.

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

### Frontend
- **React.js** - Fast, interactive UI with reusable components
- **Tailwind CSS** - Mobile-responsive styling with consistent design
- **Axios** - API communication with error handling
- **Socket.io-client** - Real-time updates and notifications

### Backend
- **Node.js** - High-performance server-side JavaScript
- **Express.js** - RESTful API framework with middleware support
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Secure token-based authentication

### Database
- **MySQL** - Reliable relational database for booking records
- **Redis** - High-performance caching and real-time data management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Football-Field-Booking-App.git
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
   
   # Import database schema
   mysql -u root -p football_booking < database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Backend environment variables
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   
   # Frontend environment variables
   cd ../frontend
   cp .env.example .env
   # Edit .env with API endpoints
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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📊 Database Schema

### Core Tables
- **Users** - User authentication and profile information
- **Teams** - Team details, logos, and member management
- **Fields** - Field locations, pricing, and availability
- **Bookings** - Reservation records and status tracking
- **Match_Results** - Game outcomes, scores, and MVP selections
- **Ratings** - Team reviews and community feedback

### Entity Relationships
```
Users 1--1 Teams
Teams M--M Bookings
Fields 1--M Bookings
Bookings 1--1 Match_Results
Teams M--M Ratings
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based API access
- **Role-Based Access Control** - Strict permission enforcement
- **Password Encryption** - bcrypt hashing for password security
- **HTTPS/TLS 1.3** - Encrypted data transmission
- **Input Validation** - Sanitization against XSS and SQL injection
- **Rate Limiting** - Protection against abuse and DDoS attacks

## 📈 Performance Metrics

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms for 95% of requests
- **Concurrent Users**: Support for 200+ daily matches
- **Uptime**: 99.9% availability target

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Fields
- `GET /api/fields` - List all available fields
- `POST /api/fields` - Create new field (Owner only)
- `PUT /api/fields/:id` - Update field details
- `DELETE /api/fields/:id` - Remove field

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team details
- `POST /api/teams/:id/join` - Join team as member

## 🔧 Development Tools

- **VS Code** - Primary code editor
- **Postman** - API testing and documentation
- **MySQL Workbench** - Database management
- **GitHub** - Version control and collaboration
- **Figma** - UI/UX design prototyping

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly across:
- Desktop computers (1920x1080 and above)
- Tablets (768px - 1024px)
- Mobile devices (320px - 768px)

## 🌍 Internationalization

- **Primary Language**: English
- **Secondary Language**: Khmer (Cambodian)
- **RTL Support**: Planned for future releases

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Test Categories
- **Unit Tests** - Individual component and function testing
- **Integration Tests** - API endpoint and database interaction testing
- **E2E Tests** - Complete user workflow testing

## 📦 Deployment

### Production Deployment
1. **Build the application**
   ```bash
   # Frontend build
   cd frontend
   npm run build
   
   # Backend production setup
   cd backend
   npm run build
   ```

2. **Environment Setup**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure database connections

3. **Server Deployment**
   ```bash
   # Using PM2 for process management
   pm2 start ecosystem.config.js
   
   # Or using Docker
   docker-compose up -d
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines
- Use ESLint for JavaScript/TypeScript linting
- Follow Prettier formatting rules
- Write meaningful commit messages
- Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Development Team

- **Scrum Master**: Phan Phoun
- **QA Testers**: Luch Samart, Pon Makara
- **Developers**: Soeng Chamrourn, Rose Rourn
- **Mentor**: Rady

## 📞 Support

For support and inquiries:
- **Email**: support@footballbooking.app
- **Documentation**: [Project Wiki](https://github.com/your-username/Football-Field-Booking-App/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/Football-Field-Booking-App/issues)

## 🗺️ Roadmap

### Phase 1 (Current Release)
- [x] Basic field booking system
- [x] User authentication and roles
- [x] Team management
- [x] Match results tracking

### Phase 2 (Future Release)
- [ ] Mobile applications (iOS/Android)
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Live streaming capabilities

### Phase 3 (Long-term)
- [ ] AI-powered team recommendations
- [ ] Virtual field tours
- [ ] Integration with sports equipment providers
- [ ] Tournament organization features

## 📊 Success Metrics

- **User Adoption**: 1000+ registered users in first 3 months
- **Daily Bookings**: 200+ matches per day
- **User Engagement**: 70% monthly active users
- **Match Completion**: 90% of bookings result in completed matches
- **User Satisfaction**: 4.5+ star rating

---

**Built with ❤️ for the Cambodian football community**