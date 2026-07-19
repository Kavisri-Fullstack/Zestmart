const express = require('express');
const {
  createCoupon,
  adminGetAllCoupons,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/coupon.controller');
const validate = require('../middlewares/validate');
const {
  createCouponSchema,
  updateCouponSchema,
  couponIdParamSchema,
} = require('../validators/coupon.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// POST /api/v1/admin/coupons
router.post('/', validate(createCouponSchema), auditLog('coupon.create', 'Coupon'), createCoupon);

// GET /api/v1/admin/coupons
router.get('/', adminGetAllCoupons);

// PATCH /api/v1/admin/coupons/:id
router.patch('/:id', validate(updateCouponSchema), auditLog('coupon.update', 'Coupon'), updateCoupon);

// DELETE /api/v1/admin/coupons/:id (soft-disable by default; ?hard=true to remove)
router.delete('/:id', validate(couponIdParamSchema), auditLog('coupon.delete', 'Coupon'), deleteCoupon);

module.exports = router;
