const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * SiteSettings collection — one of the spec's "Extra Recommended
 * Collections". Deliberately a SINGLETON: the whole app reads/writes
 * one document (enforced by always using the fixed key below), rather
 * than a key-value table, since ZestMart only needs one set of global
 * settings, not per-tenant configuration.
 */
const siteSettingsSchema = new Schema(
  {
    singletonKey: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'ZestMart' },
    siteTagline: { type: String, default: 'Premium Indian Lifestyle Ecommerce' },
    supportEmail: { type: String, default: null },
    supportPhone: { type: String, default: null },
    socialLinks: {
      instagram: { type: String, default: null },
      facebook: { type: String, default: null },
      twitter: { type: String, default: null },
    },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are currently performing maintenance. Please check back soon.' },
    freeShippingThreshold: { type: Number, default: 999, min: 0 },
    flatShippingFee: { type: Number, default: 49, min: 0 },
    defaultCurrency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
