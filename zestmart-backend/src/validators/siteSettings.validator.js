const { z } = require('zod');

const numberFromAny = z
  .union([z.number(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : Number(val)));

const boolFromAny = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => (val === undefined ? undefined : val === true || val === 'true'));

const updateSiteSettingsSchema = z.object({
  body: z.object({
    siteName: z.string().trim().max(80).optional(),
    siteTagline: z.string().trim().max(150).optional(),
    supportEmail: z.string().trim().email().optional(),
    supportPhone: z.string().trim().optional(),
    socialLinks: z
      .object({
        instagram: z.string().trim().optional(),
        facebook: z.string().trim().optional(),
        twitter: z.string().trim().optional(),
      })
      .optional(),
    maintenanceMode: boolFromAny,
    maintenanceMessage: z.string().trim().max(300).optional(),
    freeShippingThreshold: numberFromAny,
    flatShippingFee: numberFromAny,
    defaultCurrency: z.string().trim().max(10).optional(),
  }),
});

module.exports = { updateSiteSettingsSchema };
