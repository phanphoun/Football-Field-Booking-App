require('dotenv').config();
const { app, db } = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const bookingRoutes = require('./routes/bookings');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Football Field Booking API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            fields: '/api/fields',
            bookings: '/api/bookings'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

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
});