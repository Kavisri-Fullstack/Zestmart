const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const boolFromAny = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === true || val === 'true'));

const numberFromAny = z
  .union([z.number(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : Number(val)));

const createBannerSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(150),
    headline: z.string().trim().max(200).optional(),
    subheadline: z.string().trim().max(300).optional(),
    ctaText: z.string().trim().max(50).optional(),
    ctaLink: z.string().trim().optional(),
    position: z.enum(['hero', 'secondary', 'sidebar', 'footer']).optional(),
    isActive: boolFromAny,
    sortOrder: numberFromAny,
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const updateBannerSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: createBannerSchema.shape.body.partial(),
});

const bannerIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

module.exports = { createBannerSchema, updateBannerSchema, bannerIdParamSchema };
