const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/admin/users
 * Supports basic filtering by role/status and a simple name/email search.
 */
const adminGetAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { email: { $regex: req.query.q, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, users, 'Users fetched successfully', {
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
 * GET /api/v1/admin/users/:id
 */
const adminGetUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { user }, 'User fetched successfully'));
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Block/unblock a user. A blocked user's existing access tokens still
 * technically decode successfully (JWTs are stateless), but `protect`
 * checks the LIVE user status on every request, so a blocked user is
 * locked out immediately on their very next API call, not just at their
 * next login.
 */
const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot change your own account status', 'CANNOT_MODIFY_SELF');
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });

  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  res
    .status(200)
    .json(new ApiResponse(200, { user }, `User ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`));
});

module.exports = { adminGetAllUsers, adminGetUserById, adminUpdateUserStatus };
