const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

const checkRole = require('../middleware/role');
const { bookingValidation, idValidation } = require('../middleware/validation');

router.post('/', auth, checkRole(['guest', 'player', 'captain', 'field_owner', 'admin']), ...bookingValidation.create, bookingController.createBooking);
router.get('/', auth, bookingController.getBookings);
router.get('/open-matches', auth, bookingController.getOpenMatches);
router.post('/:id/join-match', auth, checkRole(['guest', 'player', 'captain', 'field_owner', 'admin']), ...idValidation, bookingController.joinOpenMatch);
router.put('/:id/confirm-match', auth, ...idValidation, bookingController.confirmMatch);
router.get('/:id', auth, ...idValidation, bookingController.getBookingById);
router.put('/:id', auth, ...idValidation, bookingController.updateBookingStatus);
router.put('/:id/confirm-teams', auth, ...idValidation, bookingController.confirmBookingTeams);

module.exports = router;
