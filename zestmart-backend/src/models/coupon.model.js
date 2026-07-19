const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Coupons collection — matches the "Coupons" section of the spec.
 * Supports both percentage and flat-amount discounts, optional
 * per-category/per-product restriction, a usage cap, and a validity
 * window.
 */
const couponSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    allowedCategories: { type: [Schema.Types.ObjectId], ref: 'Category', default: [] },
    allowedProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ allowedCategories: 1 });
couponSchema.index({ allowedProducts: 1 });

/**
 * Central place for "is this coupon currently usable" logic, reused by
 * both the /coupons/validate endpoint and checkout (future integration).
 */
couponSchema.methods.isCurrentlyValid = function isCurrentlyValid() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startsAt && now < this.startsAt) return false;
  if (this.expiresAt && now > this.expiresAt) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
