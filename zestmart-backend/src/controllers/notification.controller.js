const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/notifications
 * Auth: User. Always scoped to the caller — there is no way for one
 * user to read another user's notifications.
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = { user: req.user._id };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched successfully', {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  );
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

/**
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

/**
 * DELETE /api/v1/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
