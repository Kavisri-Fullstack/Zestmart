const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Notifications collection — matches the "Notifications" section of the spec.
 * Order updates, promos, and system alerts for a user's notification bell.
 */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['order', 'promo', 'system', 'wishlist', 'review'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    link: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes (matching spec) ----------
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
// Optional TTL — only applies to documents that actually set expiresAt.
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
