const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

router.get('/', auth, ratingController.getAllRatings);
router.get('/:id', auth, ratingController.getRatingById);
router.post('/', auth, ratingController.createRating);

module.exports = router;
