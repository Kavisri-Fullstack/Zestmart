const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateSettings } = require('../services/siteSettings.service');
const { logAdminActivity } = require('../services/adminActivity.service');

/**
 * GET /api/v1/site-settings
 * Public — the frontend reads this once on load for branding, support
 * contact info, shipping thresholds, and maintenance-mode banners.
 */
const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.status(200).json(new ApiResponse(200, { settings }, 'Site settings fetched successfully'));
});

/**
 * PATCH /api/v1/admin/site-settings
 */
const updateSiteSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();

  Object.assign(settings, req.body);
  if (req.body.socialLinks) {
    settings.socialLinks = { ...settings.socialLinks.toObject?.() ?? settings.socialLinks, ...req.body.socialLinks };
  }

  await settings.save();

  await logAdminActivity({
    adminId: req.user._id,
    action: 'siteSettings.update',
    targetType: 'SiteSettings',
    targetId: settings._id,
    details: req.body,
    ip: req.ip,
  });

  res.status(200).json(new ApiResponse(200, { settings }, 'Site settings updated successfully'));
});

module.exports = { getSiteSettings, updateSiteSettings };
