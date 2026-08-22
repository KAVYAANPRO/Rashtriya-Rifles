const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/payment.controller');

// All payment routes require authentication
router.use(authenticate);

// POST /api/v1/payment/create-order — Initiate a Razorpay order for premium upgrade
router.post('/create-order', createOrder);

// POST /api/v1/payment/verify — Verify payment signature and unlock premium
router.post('/verify', verifyPayment);

// GET /api/v1/payment/history — Get user's payment history
router.get('/history', getPaymentHistory);

module.exports = router;
