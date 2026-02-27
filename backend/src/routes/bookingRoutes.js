const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { bookingValidation, idValidation } = require('../middleware/validation');

router.post('/', auth, checkRole(['player', 'captain', 'admin']), bookingValidation.create, bookingController.createBooking);
router.get('/', auth, bookingController.getBookings);
router.get('/:id', auth, idValidation, bookingController.getBookingById);
router.put('/:id', auth, idValidation, bookingController.updateBookingStatus);

module.exports = router;