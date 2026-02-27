const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getAllNotifications);
router.get('/:id', auth, notificationController.getNotificationById);
router.post('/', auth, notificationController.createNotification);

module.exports = router;
