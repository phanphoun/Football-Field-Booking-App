const express = require('express');
const router = express.Router();
const matchResultController = require('../controllers/matchResultController');
const auth = require('../middleware/auth');

router.get('/', auth, matchResultController.getAllMatchResults);
router.get('/:id', auth, matchResultController.getMatchResultById);
router.post('/', auth, matchResultController.createMatchResult);

module.exports = router;
