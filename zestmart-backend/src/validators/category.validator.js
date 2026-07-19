const { z } = require('zod');

/**
 * Mongo ObjectId pattern, reused wherever a route param or body field
 * is expected to reference another document by _id.
 */
const objectIdRule = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must be under 80 characters'),
    description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
    icon: z.string().trim().optional(),
    parentCategory: objectIdRule.optional().nullable(),
    isActive: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === true || val === 'true')),
    sortOrder: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val === undefined ? undefined : Number(val))),
  }),
});

// Updates allow partial fields — everything from create becomes optional.
const updateCategorySchema = z.object({
  body: createCategorySchema.shape.body.partial(),
  params: z.object({
    id: objectIdRule,
  }),
});

const categoryIdParamSchema = z.object({
  params: z.object({
    id: objectIdRule,
  }),
});

const categorySlugParamSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1, 'Slug is required'),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categorySlugParamSchema,
  objectIdRule,
};
