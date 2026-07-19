const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Banners collection — matches the "Banners" section of the spec.
 * Homepage hero banners and campaign tiles managed by admins.
 */
const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    headline: { type: String, trim: true, maxlength: 200, default: '' },
    subheadline: { type: String, trim: true, maxlength: 300, default: '' },
    image: { type: String, required: true },
    imagePublicId: { type: String, default: null, select: false },
    mobileImage: { type: String, default: null },
    mobileImagePublicId: { type: String, default: null, select: false },
    ctaText: { type: String, trim: true, maxlength: 50, default: '' },
    ctaLink: { type: String, trim: true, default: '' },
    position: {
      type: String,
      enum: ['hero', 'secondary', 'sidebar', 'footer'],
      default: 'hero',
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
bannerSchema.index({ position: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ sortOrder: 1 });
bannerSchema.index({ startsAt: 1 });
bannerSchema.index({ expiresAt: 1 });

/**
 * Whether a banner should currently be shown to shoppers: active flag,
 * and (if set) within its start/expiry window.
 */
bannerSchema.methods.isCurrentlyLive = function isCurrentlyLive() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt && now < this.startsAt) return false;
  if (this.expiresAt && now > this.expiresAt) return false;
  return true;
};

module.exports = mongoose.model('Banner', bannerSchema);
