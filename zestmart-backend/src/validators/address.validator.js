const { z } = require('zod');
const { objectIdRule } = require('./category.validator');

const boolFromAny = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === true || val === 'true'));

const createAddressSchema = z.object({
  body: z.object({
    label: z.string().trim().max(30).optional(),
    fullName: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: z
      .string()
      .trim()
      .regex(/^[0-9]{4,10}$/, 'Invalid postal code'),
    country: z.string().trim().max(60).optional(),
    isDefault: boolFromAny,
  }),
});

const updateAddressSchema = z.object({
  params: z.object({ id: objectIdRule }),
  body: createAddressSchema.shape.body.partial(),
});

const addressIdParamSchema = z.object({
  params: z.object({ id: objectIdRule }),
});

module.exports = { createAddressSchema, updateAddressSchema, addressIdParamSchema };
