const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

/**
 * Validation schemas for the Orders and Checkout APIs.
 */

const placeOrderSchema = z
  .object({
    body: z.object({
      addressId: objectIdRule,
      paymentMethod: z.enum(['cod', 'razorpay'], {
        errorMap: () => ({ message: "paymentMethod must be 'cod' or 'razorpay'" }),
      }),
      notes: z.string().trim().max(500).optional(),
      couponCode: z.string().trim().min(3).max(30).optional(),
      // Only required when paymentMethod is 'razorpay' — checked out
      // below via .superRefine, since Zod's per-field rules can't see
      // sibling fields on their own.
      razorpayOrderId: z.string().trim().optional(),
      razorpayPaymentId: z.string().trim().optional(),
      razorpaySignature: z.string().trim().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    const { paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data.body;
    if (paymentMethod === 'razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body', 'razorpayPaymentId'],
          message:
            'razorpayOrderId, razorpayPaymentId, and razorpaySignature are all required when paymentMethod is "razorpay"',
        });
      }
    }
  });

const orderIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const cancelOrderSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    trackingNumber: z.string().trim().max(100).optional(),
  }),
});

const refundOrderSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }),
});

const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    orderStatus: z
      .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  }),
});

module.exports = {
  placeOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  refundOrderSchema,
  listOrdersQuerySchema,
};
