const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Reviews collection — matches the "Reviews" section of the spec.
 * One review per user per product (enforced by the compound unique
 * index below) — a user edits their existing review instead of
 * stacking multiple reviews for the same product.
 */
const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'flagged'],
      default: 'visible',
    },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
