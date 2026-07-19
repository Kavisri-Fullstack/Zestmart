const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * RecentlyViewedProducts collection — matches the spec's section of the
 * same name. A simple link collection: one document per (user, product)
 * pair, with `viewedAt` bumped (upserted) every time the product page
 * is visited again, powering the "Recently Viewed" rail and feeding the
 * simple recommendation logic in recommendation.service.js.
 */
const recentlyViewedSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// ---------- Indexes (matching spec) ----------
recentlyViewedSchema.index({ user: 1, product: 1 }, { unique: true });
recentlyViewedSchema.index({ user: 1 });
recentlyViewedSchema.index({ viewedAt: -1 });

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema);
