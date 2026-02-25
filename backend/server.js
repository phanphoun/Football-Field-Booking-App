require('dotenv').config();
const { app, db } = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const bookingRoutes = require('./routes/bookings');
const matchmakingRoutes = require('./routes/matchmaking');
const teamsRoutes = require('./routes/teams');
const usersRoutes = require('./routes/users');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/users', usersRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Football Field Booking API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            fields: '/api/fields',
            bookings: '/api/bookings',
            matchmaking: '/api/matchmaking',
            teams: '/api/teams',
            users: '/api/users'
        }
    });
});

// Error handling middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  Auth: http://localhost:${PORT}/api/auth`);
    console.log(`  Fields: http://localhost:${PORT}/api/fields`);
    console.log(`  Bookings: http://localhost:${PORT}/api/bookings`);
    console.log(`  Matchmaking: http://localhost:${PORT}/api/matchmaking`);
    console.log(`  Teams: http://localhost:${PORT}/api/teams`);
    console.log(`  Users: http://localhost:${PORT}/api/users`);
});