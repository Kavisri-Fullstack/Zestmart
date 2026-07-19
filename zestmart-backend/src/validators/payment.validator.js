const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

/**
 * Validation schemas for the Payment APIs.
 *
 * Note: POST /payments/create-order deliberately takes NO body — the
 * amount is always derived server-side from the user's live, synced
 * cart. Accepting a client-supplied amount would let a malicious
 * request pay less than the real total, so there is no schema for it.
 */

const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().trim().min(1, 'razorpayOrderId is required'),
    razorpayPaymentId: z.string().trim().min(1, 'razorpayPaymentId is required'),
    razorpaySignature: z.string().trim().min(1, 'razorpaySignature is required'),
  }),
});

const orderIdParamSchema = z.object({
  params: z.object({ orderId: objectIdRule }),
});

module.exports = { verifyPaymentSchema, orderIdParamSchema };
