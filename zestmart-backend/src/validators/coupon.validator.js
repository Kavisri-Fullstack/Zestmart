const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const boolFromAny = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === true || val === 'true'));

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(30),
    type: z.enum(['percentage', 'flat']),
    value: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => val > 0, 'value must be greater than 0'),
    minOrderAmount: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val))),
    maxDiscountAmount: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val))),
    usageLimit: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val))),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO 8601 date' }),
    isActive: boolFromAny,
    allowedCategories: z.array(objectIdRule).optional(),
    allowedProducts: z.array(objectIdRule).optional(),
  }),
});

const updateCouponSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: createCouponSchema.shape.body.partial(),
});

const couponIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'code is required'),
    cartTotal: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => val >= 0, 'cartTotal must be a non-negative number'),
  }),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  couponIdParamSchema,
  validateCouponSchema,
};
