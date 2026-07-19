const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Creates a Razorpay order. This is the FIRST step of the Razorpay
 * checkout flow: the frontend calls this to get a razorpayOrderId,
 * then opens Razorpay's checkout widget using it. Amount must be in
 * paise (smallest currency unit), matching Razorpay's API convention.
 */
const createRazorpayOrder = async (amountInRupees, receipt) => {
  if (!razorpay) {
    throw ApiError.internal(
      'Payment provider is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
      'PAYMENT_PROVIDER_NOT_CONFIGURED'
    );
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100), // paise
      currency: 'INR',
      receipt,
    });
    return order;
  } catch (err) {
    logger.error(`Razorpay order creation failed: ${err.message}`);
    throw ApiError.internal('Failed to create payment order', 'PAYMENT_ORDER_CREATE_FAILED');
  }
};

/**
 * Verifies the signature Razorpay's checkout widget returns to the
 * frontend after a successful payment. This is what proves the
 * payment is genuine and wasn't forged by a malicious client directly
 * calling our API with made-up IDs.
 *
 * Formula (per Razorpay docs): HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, key_secret)
 * must equal the signature the frontend received.
 */
const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!env.razorpay.keySecret) {
    throw ApiError.internal('Payment provider is not configured', 'PAYMENT_PROVIDER_NOT_CONFIGURED');
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

/**
 * Verifies a Razorpay webhook's signature. Webhooks are signed
 * differently from checkout responses: HMAC_SHA256 over the RAW request
 * body (not the parsed JSON — whitespace/key-order differences would
 * break the signature), using the separate webhook secret.
 */
const verifyWebhookSignature = (rawBody, signatureHeader) => {
  if (!env.razorpay.webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET is not set; rejecting webhook for safety.');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signatureHeader;
};

/**
 * Issues a refund for a captured payment via Razorpay's API.
 * Used by order cancellation and the admin refund endpoint.
 * Returns null (instead of throwing) on failure so callers can decide
 * whether to still mark the order cancelled with a "refund pending"
 * note — a failed refund call should never block the cancellation itself.
 */
const refundPayment = async (razorpayPaymentId, amountInRupees) => {
  if (!razorpay) {
    logger.warn('Razorpay is not configured; cannot process refund automatically.');
    return null;
  }

  try {
    const refund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: Math.round(amountInRupees * 100),
    });
    return refund;
  } catch (err) {
    logger.error(`Razorpay refund failed for payment ${razorpayPaymentId}: ${err.message}`);
    return null;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  refundPayment,
};
