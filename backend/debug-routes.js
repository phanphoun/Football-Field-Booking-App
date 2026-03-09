// Debug script to check registered routes
const express = require('express');

const app = express();

// Add middleware to enable routing
app.use(express.json());

// Import routes - simulate the exact same setup as server.js
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const fieldRoutes = require('./src/routes/fieldRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const teamMemberRoutes = require('./src/routes/teamMemberRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const matchResultRoutes = require('./src/routes/matchResultRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

// Register v1 routes exactly like server.js
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fields', fieldRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/team-members', teamMemberRoutes);
app.use('/api/v1/match-results', matchResultRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Print all registered routes
console.log('\n========== REGISTERED ROUTES ==========');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // Direct routes
    const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
    console.log(`${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Mounted routers
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${middleware.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '')}${handler.route.path}`);
      }
    });
  }
});
console.log('======================================\n');

