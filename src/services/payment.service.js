const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lazily create Razorpay instance so server boots even if keys aren't set yet
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Premium plan price in paise (₹999 = 99900 paise)
const PREMIUM_AMOUNT = 99900;
const PREMIUM_CURRENCY = 'INR';

/**
 * Creates a Razorpay order for premium upgrade
 */
async function createOrder(userId) {
  const razorpay = getRazorpay();
  const options = {
    amount: PREMIUM_AMOUNT,
    currency: PREMIUM_CURRENCY,
    receipt: `premium_user_${userId}_${Date.now()}`,
    notes: {
      userId: String(userId),
      plan: 'premium_unlimited',
    },
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Log the pending order in our DB
  await prisma.payment.create({
    data: {
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: PREMIUM_AMOUNT / 100,
      currency: PREMIUM_CURRENCY,
      status: 'created',
    },
  });

  return {
    orderId: razorpayOrder.id,
    amount: PREMIUM_AMOUNT,
    currency: PREMIUM_CURRENCY,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verifies the Razorpay payment signature after client completes payment
 */
async function verifyPayment(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  // Step 1: Cryptographically verify the signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new Error('Payment signature verification failed. Possible fraud attempt.');
  }

  // Step 2: Update our payment record
  await prisma.payment.update({
    where: { razorpayOrderId: razorpay_order_id },
    data: {
      razorpayPaymentId: razorpay_payment_id,
      status: 'success',
    },
  });

  // Step 3: Upgrade user to premium
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  });

  return { success: true, message: 'Payment verified! Your account has been upgraded to Premium.' };
}

/**
 * Get payment history for a user
 */
async function getPaymentHistory(userId) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });
}

module.exports = { createOrder, verifyPayment, getPaymentHistory };
