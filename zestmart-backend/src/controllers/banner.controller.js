const { Banner } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage, deleteImage } = require('../services/cloudinary.service');

/**
 * GET /api/v1/banners
 * Public. Only ever returns banners that are active AND within their
 * start/expiry window, sorted for direct display.
 */
const getActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    startsAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
  };
  if (req.query.position) filter.position = req.query.position;

  const banners = await Banner.find(filter).sort('sortOrder -createdAt');

  res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched successfully'));
});

// ---------- Admin ----------

/**
 * POST /api/v1/admin/banners
 * Body: form-data with an "image" file field (required) and optional
 * "mobileImage" file field.
 */
const createBanner = asyncHandler(async (req, res) => {
  if (!req.files?.image?.[0]) {
    throw ApiError.badRequest('A banner image is required', 'IMAGE_REQUIRED');
  }

  const uploaded = await uploadImage(req.files.image[0], 'zestmart/banners');

  let mobileUploaded = null;
  if (req.files?.mobileImage?.[0]) {
    mobileUploaded = await uploadImage(req.files.mobileImage[0], 'zestmart/banners');
  }

  const banner = await Banner.create({
    ...req.body,
    image: uploaded.url,
    imagePublicId: uploaded.publicId,
    mobileImage: mobileUploaded?.url || null,
    mobileImagePublicId: mobileUploaded?.publicId || null,
  });

  res.status(201).json(new ApiResponse(201, { banner }, 'Banner created successfully'));
});

/**
 * GET /api/v1/admin/banners
 */
const adminGetAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().select('+imagePublicId +mobileImagePublicId').sort('sortOrder -createdAt');
  res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched successfully'));
});

/**
 * PATCH /api/v1/admin/banners/:id
 */
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id).select('+imagePublicId +mobileImagePublicId');
  if (!banner) {
    throw ApiError.notFound('Banner not found', 'BANNER_NOT_FOUND');
  }

  Object.assign(banner, req.body);

  if (req.files?.image?.[0]) {
    const uploaded = await uploadImage(req.files.image[0], 'zestmart/banners');
    if (banner.imagePublicId) await deleteImage(banner.imagePublicId);
    banner.image = uploaded.url;
    banner.imagePublicId = uploaded.publicId;
  }

  if (req.files?.mobileImage?.[0]) {
    const uploaded = await uploadImage(req.files.mobileImage[0], 'zestmart/banners');
    if (banner.mobileImagePublicId) await deleteImage(banner.mobileImagePublicId);
    banner.mobileImage = uploaded.url;
    banner.mobileImagePublicId = uploaded.publicId;
  }

  await banner.save();

  res.status(200).json(new ApiResponse(200, { banner }, 'Banner updated successfully'));
});

/**
 * DELETE /api/v1/admin/banners/:id
 */
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id).select('+imagePublicId +mobileImagePublicId');
  if (!banner) {
    throw ApiError.notFound('Banner not found', 'BANNER_NOT_FOUND');
  }

  if (banner.imagePublicId) await deleteImage(banner.imagePublicId);
  if (banner.mobileImagePublicId) await deleteImage(banner.mobileImagePublicId);

  await banner.deleteOne();

  res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});

module.exports = { getActiveBanners, createBanner, adminGetAllBanners, updateBanner, deleteBanner };
