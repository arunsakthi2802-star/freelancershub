const express = require('express');
const router = express.Router();
const {
  getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.delete('/', protect, deleteAllNotifications);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
