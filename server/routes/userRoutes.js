const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, getProfile, updateProfile,
  uploadAvatar, uploadResume, addPortfolioItem, deletePortfolioItem,
  getTopFreelancers, deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadImage, uploadDocument } = require('../middleware/upload');

router.get('/', getUsers);
router.get('/top-freelancers', getTopFreelancers);
router.get('/profile', protect, getProfile);
router.get('/:id', getUserById);

router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadImage.single('avatar'), uploadAvatar);
router.put('/resume', protect, uploadDocument.single('resume'), uploadResume);

router.post('/portfolio', protect, uploadImage.single('portfolio'), addPortfolioItem);
router.delete('/portfolio/:itemId', protect, deletePortfolioItem);
router.delete('/account', protect, deleteAccount);

module.exports = router;
