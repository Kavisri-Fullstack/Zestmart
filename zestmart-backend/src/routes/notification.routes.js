const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notification.controller');
const validate = require('../middlewares/validate');
const {
  notificationIdParamSchema,
  listNotificationsQuerySchema,
} = require('../validators/notification.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every notification route requires a logged-in user.
router.use(protect);

// GET /api/v1/notifications
router.get('/', validate(listNotificationsQuerySchema), getMyNotifications);

// PATCH /api/v1/notifications/read-all
// IMPORTANT: this must be registered BEFORE "/:id/read", otherwise
// Express would treat "read-all" itself as an :id value and never
// reach this handler.
router.patch('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', validate(notificationIdParamSchema), markAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', validate(notificationIdParamSchema), deleteNotification);

module.exports = router;
