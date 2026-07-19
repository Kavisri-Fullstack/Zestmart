const express = require('express');
const { updateSiteSettings } = require('../controllers/siteSettings.controller');
const validate = require('../middlewares/validate');
const { updateSiteSettingsSchema } = require('../validators/siteSettings.validator');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// PATCH /api/v1/admin/site-settings
router.patch('/', protect, restrictTo('admin'), validate(updateSiteSettingsSchema), updateSiteSettings);

module.exports = router;
