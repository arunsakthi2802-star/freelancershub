const express = require('express');
const router = express.Router();
const {
  register, login, adminLogin, logout, getMe,
  verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;
