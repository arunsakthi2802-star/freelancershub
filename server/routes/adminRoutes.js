const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleBanUser, verifyUserEmail, deleteUser,
  getAllProjects, toggleFeaturedProject, getAllReviews, deleteReview,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All admin routes are protected
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/verify', verifyUserEmail);
router.delete('/users/:id', deleteUser);

// Project management
router.get('/projects', getAllProjects);
router.put('/projects/:id/feature', toggleFeaturedProject);

// Review management
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
