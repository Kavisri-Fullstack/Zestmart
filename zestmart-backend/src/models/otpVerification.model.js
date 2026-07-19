const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * OTPVerifications collection — matches the "OTPVerifications" section
 * of the spec. Powers both signup email verification and the
 * forgot-password flow. Codes are stored as a bcrypt hash (never
 * plaintext), and each document self-expires via the TTL index below
 * once `expiresAt` passes.
 */
const otpVerificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },
    purpose: {
      type: String,
      enum: ['signup_verification', 'password_reset'],
      required: true,
    },
    codeHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
otpVerificationSchema.index({ email: 1 });
otpVerificationSchema.index({ phone: 1 });
otpVerificationSchema.index({ purpose: 1 });
// TTL: MongoDB automatically deletes a document once `expiresAt` is in
// the past — no manual cleanup job needed for stale OTP codes.
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
