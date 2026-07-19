const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Payments collection — matches the "Payments" section of the spec.
 * Kept separate from Order for clean transaction tracking (one order
 * can, in principle, have its payment retried/reissued without
 * mutating the order record itself).
 */
const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['razorpay', 'cod'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: { 
      type: String, 
      /*default: null */
      sparse:true
    },
    razorpayPaymentId: { type: String, 
      /*default: null*/
      sparse:true
    },
    razorpaySignature: { type: String, default: null, select: false },
    failureReason: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
paymentSchema.index({ order: 1 }, { unique: true });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
