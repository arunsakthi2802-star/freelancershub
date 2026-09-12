const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
