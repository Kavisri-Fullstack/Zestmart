const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

/**
 * Validation schemas for the Cart APIs.
 */

const addCartItemSchema = z.object({
  body: z.object({
    productId: objectIdRule,
    quantity: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? 1 : Number(val)))
      .refine((val) => Number.isInteger(val) && val >= 1, 'quantity must be a whole number of at least 1'),
    variant: z.string().trim().max(100).optional(),
  }),
});

const updateCartItemSchema = z.object({
  params: z.object({ productId: objectIdRule }),
  body: z.object({
    quantity: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => Number.isInteger(val) && val >= 1, 'quantity must be a whole number of at least 1'),
    variant: z.string().trim().max(100).optional(),
  }),
});

const cartItemParamSchema = z.object({
  params: z.object({ productId: objectIdRule }),
});

module.exports = { addCartItemSchema, updateCartItemSchema, cartItemParamSchema };
