const { Coupon } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { validateCouponForCart } = require('../services/coupon.service');

/**
 * POST /api/v1/coupons/validate
 * Auth: User. Checks a coupon code against the caller's cart total and
 * returns the discount it would apply, without mutating anything —
 * usedCount is only incremented for real at checkout (see
 * coupon.service.js's incrementCouponUsage, wired into
 * order.controller.js's placeOrder).
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  const { coupon, discountAmount } = await validateCouponForCart(code, cartTotal);

  res.status(200).json(
    new ApiResponse(200, { coupon, discountAmount }, 'Coupon is valid')
  );
});

/**
 * GET /api/v1/coupons/active
 * Auth: Public/User. Lists currently-active, non-expired coupons —
 * useful for a "current offers" banner. Does not require a cart total.
 */
const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    startsAt: { $lte: now },
    expiresAt: { $gte: now },
  }).select('-allowedProducts -allowedCategories');

  res.status(200).json(new ApiResponse(200, { coupons }, 'Active coupons fetched successfully'));
});

// ---------- Admin ----------

/**
 * POST /api/v1/admin/coupons
 */
const createCoupon = asyncHandler(async (req, res) => {
  const code = req.body.code.toUpperCase();

  const existing = await Coupon.findOne({ code });
  if (existing) {
    throw ApiError.conflict('A coupon with this code already exists', 'COUPON_EXISTS');
  }

  const coupon = await Coupon.create({ ...req.body, code });

  res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created successfully'));
});

/**
 * GET /api/v1/admin/coupons
 */
const adminGetAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.status(200).json(new ApiResponse(200, { coupons }, 'Coupons fetched successfully'));
});

/**
 * PATCH /api/v1/admin/coupons/:id
 */
const updateCoupon = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.code) updates.code = updates.code.toUpperCase();

  if (updates.code) {
    const existing = await Coupon.findOne({ code: updates.code, _id: { $ne: req.params.id } });
    if (existing) {
      throw ApiError.conflict('A coupon with this code already exists', 'COUPON_EXISTS');
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon updated successfully'));
});

/**
 * DELETE /api/v1/admin/coupons/:id
 * Matches the spec's "Disable/delete coupon" — soft-disables by default
 * (isActive: false) rather than hard-deleting, so historical orders that
 * reference this coupon code keep making sense. Pass ?hard=true to
 * actually remove the document.
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  if (req.query.hard === 'true') {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
    }
    return res.status(200).json(new ApiResponse(200, null, 'Coupon permanently deleted'));
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) {
    throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
  }

  res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon disabled successfully'));
});

module.exports = {
  validateCoupon,
  getActiveCoupons,
  createCoupon,
  adminGetAllCoupons,
  updateCoupon,
  deleteCoupon,
};
