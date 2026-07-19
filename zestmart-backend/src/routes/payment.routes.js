const express = require('express');
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentByOrder,
} = require('../controllers/payment.controller');
const validate = require('../middlewares/validate');
const { verifyPaymentSchema, orderIdParamSchema } = require('../validators/payment.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// POST /api/v1/payments/webhook — called by Razorpay's servers, not a
// logged-in user, so this route deliberately sits BEFORE `protect` and
// is never auth-gated. Its own signature check (inside the controller)
// is what proves the request is genuinely from Razorpay.
router.post('/webhook', handleWebhook);

// Every other payment route requires a logged-in user.
router.use(protect);

// POST /api/v1/payments/create-order
router.post('/create-order', createOrder);

// POST /api/v1/payments/verify
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);

// GET /api/v1/payments/:orderId
router.get('/:orderId', validate(orderIdParamSchema), getPaymentByOrder);

module.exports = router;
