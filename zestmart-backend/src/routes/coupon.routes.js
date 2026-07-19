const express = require('express');
const { validateCoupon, getActiveCoupons } = require('../controllers/coupon.controller');
const validate = require('../middlewares/validate');
const { validateCouponSchema } = require('../validators/coupon.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// GET /api/v1/coupons/active — public/user, no login required to browse offers
router.get('/active', getActiveCoupons);

// POST /api/v1/coupons/validate — requires login (ties usage to a real account)
router.post('/validate', protect, validate(validateCouponSchema), validateCoupon);

module.exports = router;
