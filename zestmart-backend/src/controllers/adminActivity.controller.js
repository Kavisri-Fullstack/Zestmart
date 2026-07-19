const { AdminActivity } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/admin/activity-logs
 * Read-only audit trail viewer. Supports filtering by admin, action,
 * or target type — e.g. "show me everything Admin X did to Coupons".
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

  const filter = {};
  if (req.query.admin) filter.admin = req.query.admin;
  if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
  if (req.query.targetType) filter.targetType = req.query.targetType;

  const [logs, total] = await Promise.all([
    AdminActivity.find(filter)
      .populate('admin', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    AdminActivity.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, logs, 'Activity logs fetched successfully', {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  );
});

module.exports = { getActivityLogs };
