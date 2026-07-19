const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Carts collection — matches the "Carts" section of the spec.
 * Stores shopping intent before checkout. Each user has exactly one
 * active cart (enforced by the unique index on `user`).
 *
 * Design note: the spec's Cart APIs address items by :productId only
 * (PATCH/DELETE /cart/items/:productId), so this schema keeps ONE line
 * per product — adding the same product again increases its quantity
 * (and updates the variant to whatever was sent most recently) instead
 * of creating a second line for a different variant.
 */
const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },
    image: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: { type: String, default: null },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingEstimate: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ updatedAt: 1 });
// Optional TTL — only takes effect on documents that actually have expiresAt set.
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Cart', cartSchema);
