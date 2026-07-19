const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Orders collection — matches the "Orders" section of the spec.
 * Orders store SNAPSHOTS of item/address data at the time of purchase
 * (not live references), so editing or deleting a product/address later
 * never changes historical order records — this is intentional and
 * matches the spec's design note under "Relationship Summary".
 */
const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    slug: { type: String, default: null },
    image: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant: { type: String, default: null },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const addressSnapshotSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    shippingFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, default: null },
    trackingNumber: { type: String, default: null },
    invoiceNumber: { type: String, required: true, unique: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    cancelReason: { type: String, default: null },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ user: 1, placedAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
