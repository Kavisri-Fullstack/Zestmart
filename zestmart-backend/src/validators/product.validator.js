const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

/**
 * Product create/update requests are sent as multipart/form-data (because
 * image files travel alongside them), so every field arrives in req.body
 * as a string even when it's logically a number, boolean, or array. These
 * helpers coerce them back to the right type before the rest of the app
 * (and Mongoose) sees them.
 */
const numberFromString = (label) =>
  z
    .union([z.number(), z.string()])
    .transform((val, ctx) => {
      const num = Number(val);
      if (Number.isNaN(num)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a number` });
        return z.NEVER;
      }
      return num;
    });

const booleanFromString = () =>
  z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === true || val === 'true'));

/**
 * Accepts either a real array (JSON requests) or a comma-separated string
 * (form-data requests) and always outputs a clean string array.
 */
const arrayFromCsv = () =>
  z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return val.map((v) => v.trim()).filter(Boolean);
      return val
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    });

const createProductSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(150, 'Title must be under 150 characters'),
    description: z.string({ required_error: 'Description is required' }).trim().min(1),
    shortDescription: z.string().trim().max(200).optional(),
    price: numberFromString('Price'),
    compareAtPrice: numberFromString('compareAtPrice').optional(),
    discountPercent: numberFromString('discountPercent').optional(),
    stock: numberFromString('Stock'),
    sku: z.string().trim().optional(),
    category: objectIdRule,
    subCategory: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    tags: arrayFromCsv(),
    features: arrayFromCsv(),
    isFeatured: booleanFromString(),
    isTrending: booleanFromString(),
    isBestSeller: booleanFromString(),
    isNewArrival: booleanFromString(),
    isActive: booleanFromString(),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
  }),
});

const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
  params: z.object({
    id: objectIdRule,
  }),
});

const productIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

const updateStockSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: z.object({
    stock: numberFromString('stock').refine((val) => val >= 0, 'stock must be a non-negative number'),
  }),
});

const productSlugParamSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1, 'Slug is required') }),
});

/**
 * Query schema for GET /products — validates and coerces pagination/filter
 * params. Every field is optional since all listing filters are optional.
 */
const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    q: z.string().trim().optional(),
    category: objectIdRule.optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    rating: z.string().regex(/^[0-5](\.\d+)?$/).optional(),
    sort: z.string().optional(),
    featured: z.enum(['true', 'false']).optional(),
    trending: z.enum(['true', 'false']).optional(),
    newArrival: z.enum(['true', 'false']).optional(),
    bestseller: z.enum(['true', 'false']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  updateStockSchema,
  productSlugParamSchema,
  listProductsQuerySchema,
};
