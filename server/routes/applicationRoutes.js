const express = require('express');
const router = express.Router();
const {
  applyToProject, getProjectApplications, getMyApplications,
  updateApplicationStatus, withdrawApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.post('/', protect, authorize('freelancer'), applyToProject);
router.get('/my-applications', protect, authorize('freelancer'), getMyApplications);
router.get('/project/:projectId', protect, authorize('client', 'admin'), getProjectApplications);
router.put('/:id', protect, authorize('client'), updateApplicationStatus);
router.put('/:id/withdraw', protect, authorize('freelancer'), withdrawApplication);

module.exports = router;
