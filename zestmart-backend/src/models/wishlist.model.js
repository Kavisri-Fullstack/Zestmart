const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Wishlists collection — matches the "Wishlists" section of the spec.
 * Each user has exactly one wishlist document (enforced by the unique
 * index on `user`), containing a list of saved product references.
 */
const wishlistItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { _id: false }
);

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
wishlistSchema.index({ user: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
