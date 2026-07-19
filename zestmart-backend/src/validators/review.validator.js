const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const createReviewSchema = z.object({
  params: z.object({ productId: objectIdRule }),
  body: z.object({
    rating: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine((val) => Number.isInteger(val) && val >= 1 && val <= 5, 'rating must be a whole number from 1 to 5'),
    comment: z.string().trim().max(1000).optional(),
    images: z.array(z.string()).max(5).optional(),
  }),
});

const updateReviewSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    rating: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1 && val <= 5), {
        message: 'rating must be a whole number from 1 to 5',
      }),
    comment: z.string().trim().max(1000).optional(),
    images: z.array(z.string()).max(5).optional(),
  }),
});

const reviewIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const productIdParamSchema = z.object({
  params: z.object({ productId: objectIdRule }),
});

module.exports = { createReviewSchema, updateReviewSchema, reviewIdParamSchema, productIdParamSchema };
