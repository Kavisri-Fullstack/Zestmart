const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * AdminActivities collection — one of the spec's "Extra Recommended
 * Collections". An audit trail of admin mutations: who did what, to
 * which resource, and when. Never exposed to non-admins.
 */
const adminActivitySchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true }, // e.g. "coupon.create", "order.status_update"
    targetType: { type: String, required: true, trim: true }, // e.g. "Coupon", "Order", "User"
    targetId: { type: Schema.Types.ObjectId, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
adminActivitySchema.index({ admin: 1 });
adminActivitySchema.index({ action: 1 });
adminActivitySchema.index({ targetType: 1, targetId: 1 });
adminActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
