const express = require('express');
const router = express.Router();
const { createIntent, stripeWebhook, getPaymentHistory, getPaymentById, confirmMockPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Webhook - raw body (handled in server.js)
router.post('/webhook', stripeWebhook);

router.post('/create-intent', protect, authorize('client'), createIntent);
router.post('/confirm-mock', protect, authorize('client'), confirmMockPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/:id', protect, getPaymentById);

module.exports = router;
