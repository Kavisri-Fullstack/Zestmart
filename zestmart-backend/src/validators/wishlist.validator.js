const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

/**
 * Validation schemas for the Wishlist APIs.
 */

const addWishlistItemSchema = z.object({
  body: z.object({
    productId: objectIdRule,
    note: z.string().trim().max(200).optional(),
  }),
});

const wishlistItemParamSchema = z.object({
  params: z.object({ productId: objectIdRule }),
});

module.exports = { addWishlistItemSchema, wishlistItemParamSchema };
