const { AdminActivity } = require('../models');
const logger = require('../utils/logger');

/**
 * Records one admin action for the audit trail. Called as a side effect
 * from admin controllers, AFTER the real action already succeeded —
 * never blocks or fails the actual request if logging itself has a
 * problem (swallows errors, just logs them).
 *
 * Usage: logAdminActivity({ adminId, action: 'coupon.create', targetType: 'Coupon', targetId: coupon._id, details: { code: coupon.code }, ip: req.ip })
 */
const logAdminActivity = async ({ adminId, action, targetType, targetId = null, details = {}, ip = null }) => {
  try {
    await AdminActivity.create({ admin: adminId, action, targetType, targetId, details, ipAddress: ip });
  } catch (err) {
    logger.error(`Failed to write admin activity log (${action}): ${err.message}`);
  }
};

module.exports = { logAdminActivity };
