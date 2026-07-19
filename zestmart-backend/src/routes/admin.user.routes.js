const express = require('express');
const {
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateUserStatus,
} = require('../controllers/admin.user.controller');
const validate = require('../middlewares/validate');
const {
  userIdParamSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} = require('../validators/adminUser.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// GET /api/v1/admin/users
router.get('/', validate(listUsersQuerySchema), adminGetAllUsers);

// GET /api/v1/admin/users/:id
router.get('/:id', validate(userIdParamSchema), adminGetUserById);

// PATCH /api/v1/admin/users/:id/status
router.patch('/:id/status', validate(updateUserStatusSchema), auditLog('user.status_update', 'User'), adminUpdateUserStatus);

module.exports = router;
