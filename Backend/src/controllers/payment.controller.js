const paymentService = require('../services/payment.service');

/**
 * POST /api/v1/payment/create-order
 * Creates a Razorpay order for premium upgrade
 */
const createOrder = async (req, res, next) => {
  try {
    if (req.user.isPremium) {
      return res.status(400).json({ success: false, message: 'You are already a Premium user!' });
    }
    const order = await paymentService.createOrder(req.user.id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payment/verify
 * Verifies Razorpay signature and upgrades user to Premium
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details. Please provide order_id, payment_id and signature.' });
    }
    const result = await paymentService.verifyPayment(req.user.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payment/history
 * Returns all payments made by the user
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const history = await paymentService.getPaymentHistory(req.user.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
