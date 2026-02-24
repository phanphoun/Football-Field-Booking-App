const express = require('express');
const router = express.Router();
const { 
    getUserBookings, 
    createBooking, 
    getBookingById, 
    updateBookingStatus, 
    cancelBooking 
} = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

// Public route for testing (should be protected in production)
router.get('/user/:userId', getUserBookings);

// All other booking routes require authentication
router.use(authenticateToken);

router.get('/', getUserBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', cancelBooking);

module.exports = router;
