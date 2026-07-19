const { Notification } = require('../models');
const logger = require('../utils/logger');

/**
 * Creates a notification for a user. Used by other modules (order
 * status changes, etc.) rather than being called directly by a route —
 * notifications are a side effect of other actions, not a resource
 * users create themselves.
 *
 * Deliberately swallows errors (logs instead of throwing) so a
 * notification failure never breaks the primary action that triggered
 * it (e.g. an order status update should still succeed even if, for
 * some reason, writing the notification document fails).
 */
const notifyUser = async ({ userId, type = 'system', title, message, link = null, priority = 'normal' }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link, priority });
  } catch (err) {
    logger.error(`Failed to create notification for user ${userId}: ${err.message}`);
  }
};

module.exports = { notifyUser };
