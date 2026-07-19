const Razorpay = require('razorpay');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Razorpay instance, reused by the Payment APIs (create-order, verify, webhook).
 * Actual payment controllers are built in the Payments phase, not Phase 1.
 */
let razorpayInstance = null;

if (env.razorpay.keyId && env.razorpay.keySecret) {
  razorpayInstance = new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
} else {
  logger.warn(
    'Razorpay credentials are missing. Payment endpoints will fail until RAZORPAY_* env vars are set.'
  );
}

module.exports = razorpayInstance;
