const { Coupon } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Computes the discount amount a coupon would apply to a given cart
 * total, honoring `maxDiscountAmount` as a cap on percentage coupons.
 * Extracted here (out of coupon.controller.js) so checkout can reuse
 * the exact same math the /coupons/validate endpoint uses — there must
 * never be two slightly-different discount formulas in the codebase.
 */
const calculateDiscount = (coupon, cartTotal) => {
  let discount = coupon.type === 'percentage' ? (cartTotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  return Math.min(Math.round(discount * 100) / 100, cartTotal);
};

/**
 * Validates a coupon code against a cart total and returns both the
 * coupon document and the discount it applies. Throws ApiError on any
 * problem (not found, expired/inactive, minimum not met) so callers
 * (checkout and /coupons/validate) get identical error codes.
 */
const validateCouponForCart = async (code, cartTotal) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw ApiError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
  }

  if (!coupon.isCurrentlyValid()) {
    throw ApiError.badRequest('This coupon is no longer valid', 'COUPON_EXPIRED_OR_INACTIVE');
  }

  if (cartTotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(
      `This coupon requires a minimum order of ₹${coupon.minOrderAmount}`,
      'MIN_ORDER_NOT_MET'
    );
  }

  const discountAmount = calculateDiscount(coupon, cartTotal);
  return { coupon, discountAmount };
};

/**
 * Atomically increments a coupon's usedCount, but ONLY if doing so
 * wouldn't exceed usageLimit. This is a conditional update (not a
 * read-then-write), so two customers using the last remaining use of a
 * limited coupon at the exact same moment can never both succeed —
 * exactly the same race-condition protection used for product stock
 * in order.service.js.
 *
 * Returns true if the increment succeeded, false if the coupon had
 * just been exhausted by someone else between validation and checkout.
 */
const incrementCouponUsage = async (couponId) => {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  return Boolean(updated);
};

/**
 * Reverses a coupon usage increment — used when an order that applied
 * a coupon is cancelled, so the discount "gives back" its usage slot.
 */
const decrementCouponUsage = async (couponId) => {
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: -1 } });
};

module.exports = { calculateDiscount, validateCouponForCart, incrementCouponUsage, decrementCouponUsage };
