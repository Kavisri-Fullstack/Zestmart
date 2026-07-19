const express = require('express');
const {
  createBanner,
  adminGetAllBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/banner.controller');
const validate = require('../middlewares/validate');
const { createBannerSchema, updateBannerSchema, bannerIdParamSchema } = require('../validators/banner.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const { uploadBannerImages } = require('../middlewares/upload');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// POST /api/v1/admin/banners
router.post('/', uploadBannerImages, validate(createBannerSchema), auditLog('banner.create', 'Banner'), createBanner);

// GET /api/v1/admin/banners
router.get('/', adminGetAllBanners);

// PATCH /api/v1/admin/banners/:id
router.patch('/:id', uploadBannerImages, validate(updateBannerSchema), auditLog('banner.update', 'Banner'), updateBanner);

// DELETE /api/v1/admin/banners/:id
router.delete('/:id', validate(bannerIdParamSchema), auditLog('banner.delete', 'Banner'), deleteBanner);

module.exports = router;
