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

// All booking routes require authentication
router.use(authenticateToken);

router.get('/', getUserBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', cancelBooking);

module.exports = router;
