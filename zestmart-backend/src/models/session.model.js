const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

/**
 * Sessions collection — one of the spec's "Extra Recommended
 * Collections" (listed as "RefreshTokens or Sessions for tighter auth
 * control"). Rather than storing the actual refresh token JWT (which
 * would be sensitive and redundant, since the JWT itself is already
 * self-verifying), this stores a HASH of it plus device/browser
 * metadata — enough to let a user see "where am I logged in" and
 * revoke one specific device remotely, which a stateless JWT alone
 * can never support (a bare JWT stays valid until it expires, with no
 * way to kill just one of several logged-in devices).
 */
const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refreshTokenHash: { type: String, required: true, select: false },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
sessionSchema.index({ user: 1 });
sessionSchema.index({ refreshTokenHash: 1 });
// TTL: a session document is cleaned up automatically once its
// refresh token would have expired anyway.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * One-way hash of a refresh token JWT, used as a lookup key. SHA-256
 * (not bcrypt) is appropriate here — unlike a password or OTP, a JWT is
 * already a long, high-entropy random-looking string, so a fast
 * deterministic hash is fine and lets us look it up by exact match
 * (bcrypt hashes can't be looked up this way, only compared one at a time).
 */
sessionSchema.statics.hashToken = function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = mongoose.model('Session', sessionSchema);
