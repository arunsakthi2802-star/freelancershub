const express = require('express');
const router = express.Router();
const {
  getProjects, getProjectById, createProject, updateProject,
  deleteProject, getClientProjects, getFeaturedProjects, getProjectStats,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/stats', getProjectStats);
router.get('/client/my-projects', protect, authorize('client'), getClientProjects);
router.get('/:id', getProjectById);

router.post('/', protect, authorize('client'), createProject);
router.put('/:id', protect, authorize('client', 'admin'), updateProject);
router.delete('/:id', protect, authorize('client', 'admin'), deleteProject);

module.exports = router;
