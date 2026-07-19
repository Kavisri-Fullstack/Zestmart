const { Order, Payment } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateCart, syncCartWithProducts } = require('../services/cart.service');
const { buildOrderPricing } = require('../services/order.service');
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require('../services/payment.service');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * POST /api/v1/payments/create-order
 * Creates a Razorpay order sized to the user's CURRENT live cart total
 * — never a client-supplied amount, so there's no way to tamper with
 * the price before payment. The frontend uses the returned
 * razorpayOrderId to open Razorpay's checkout widget.
 */
const createOrder = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { cart: syncedCart } = await syncCartWithProducts(cart);

  if (syncedCart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty', 'CART_EMPTY');
  }

  const pricing = buildOrderPricing(syncedCart);
  
  const shortId = String(req.user._Id).slice(-8);
  const receipt = `cart_${shortId}_${Date.now()}`;

  const razorpayOrder = await createRazorpayOrder(pricing.totalAmount, receipt);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.razorpay.keyId,
      },
      'Razorpay order created successfully'
    )
  );
});

/**
 * POST /api/v1/payments/verify
 * Standalone signature check — lets the frontend confirm a payment
 * succeeded and show a success screen immediately after Razorpay's
 * checkout widget closes. This is a CONVENIENCE check only: the
 * authoritative verification happens again inside POST /orders before
 * anything is written to the database, so this endpoint alone can never
 * be used to fake a paid order.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const isValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  if (!isValid) {
    throw ApiError.unauthorized('Payment verification failed', 'PAYMENT_VERIFICATION_FAILED');
  }

  res.status(200).json(new ApiResponse(200, { verified: true }, 'Payment verified successfully'));
});

/**
 * POST /api/v1/payments/webhook
 * Razorpay server-to-server webhook for async events (payment.captured,
 * payment.failed, refund.processed, etc). Verified against the RAW
 * request body using RAZORPAY_WEBHOOK_SECRET (see app.js, where
 * express.json()'s `verify` option stashes the raw bytes on req.rawBody).
 *
 * Limitation: this only updates a Payment record that already exists
 * (i.e. an order that was already placed). Because this project's
 * checkout flow creates the Payment record at the same time as the
 * Order (inside POST /orders), a webhook arriving for a payment whose
 * order was never completed has nothing to attach to yet, and is
 * safely no-op'd (logged, not errored) — Razorpay's dashboard remains
 * the source of truth for any payment that never became an order.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!req.rawBody || !signature || !verifyWebhookSignature(req.rawBody, signature)) {
    logger.warn('Rejected Razorpay webhook: invalid or missing signature.');
    throw ApiError.unauthorized('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  if (!event || !paymentEntity) {
    return res.status(200).json(new ApiResponse(200, null, 'Webhook received (no actionable payload)'));
  }

  const payment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });

  if (!payment) {
    logger.info(`Webhook for unknown payment ${paymentEntity.id} (event: ${event}) — no matching order yet.`);
    return res.status(200).json(new ApiResponse(200, null, 'Webhook received (no matching order)'));
  }

  if (event === 'payment.captured') {
    payment.status = 'captured';
    payment.paidAt = payment.paidAt || new Date();
    await payment.save();
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid' });
  } else if (event === 'payment.failed') {
    payment.status = 'failed';
    payment.failureReason = paymentEntity.error_description || 'Payment failed';
    await payment.save();
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'failed' });
  }

  res.status(200).json(new ApiResponse(200, null, 'Webhook processed successfully'));
});

/**
 * GET /api/v1/payments/:orderId
 * Returns the payment record for a given Order (our _id, not
 * Razorpay's order id). Owner or admin only.
 */
const getPaymentByOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }

  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to view this payment', 'FORBIDDEN');
  }

  const payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    throw ApiError.notFound('Payment record not found for this order', 'PAYMENT_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { payment }, 'Payment details fetched successfully'));
});

module.exports = { createOrder, verifyPayment, handleWebhook, getPaymentByOrder };
