const express = require('express');
const router = express.Router();
const {
  getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:roomId', protect, getMessages);
router.post('/', protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
