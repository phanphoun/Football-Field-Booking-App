const { Notification, User } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllNotifications = asyncHandler(async (req, res) => {
  const { userId, isRead, type } = req.query;
  const whereClause = {};
  
  if (userId) whereClause.userId = userId;
  if (isRead !== undefined) whereClause.isRead = isRead === 'true';
  if (type) whereClause.type = type;

  const notifications = await Notification.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: notifications });
});

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }
    ]
  });
  
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  
  res.json({ success: true, data: notification });
});

const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json({ success: true, data: notification });
});

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification
};
