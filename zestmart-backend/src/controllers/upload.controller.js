const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage, uploadImages, deleteImage } = require('../services/cloudinary.service');

/**
 * Only a small whitelist of folders is allowed, rather than trusting a
 * client-supplied path directly — this prevents someone from passing
 * an arbitrary `folder` value to write into unrelated parts of the
 * Cloudinary account (path traversal / organization abuse).
 */
const ALLOWED_FOLDERS = {
  avatar: 'zestmart/avatars',
  misc: 'zestmart/misc',
  review: 'zestmart/reviews',
};

const resolveFolder = (key) => ALLOWED_FOLDERS[key] || ALLOWED_FOLDERS.misc;

/**
 * POST /api/v1/uploads/image
 * Auth: any logged-in user (e.g. uploading their own avatar or a photo
 * to attach to a review) — NOT admin-only, matching the spec's
 * "Admin/User if allowed" note. Body: multipart/form-data, field "image".
 */
const uploadSingleImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('An image file is required', 'IMAGE_REQUIRED');
  }

  const folder = resolveFolder(req.body.folder);
  const uploaded = await uploadImage(req.file, folder);

  res.status(201).json(
    new ApiResponse(201, { url: uploaded.url, publicId: uploaded.publicId }, 'Image uploaded successfully')
  );
});

/**
 * POST /api/v1/uploads/images
 * Auth: Admin. Body: multipart/form-data, field "images" (up to 10).
 */
const uploadMultipleImagesHandler = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('At least one image file is required', 'IMAGES_REQUIRED');
  }

  const folder = resolveFolder(req.body.folder);
  const uploaded = await uploadImages(req.files, folder);

  res.status(201).json(
    new ApiResponse(
      201,
      { images: uploaded.map((img) => ({ url: img.url, publicId: img.publicId })) },
      'Images uploaded successfully'
    )
  );
});

/**
 * DELETE /api/v1/uploads/image
 * Auth: Admin. Body: { publicId }.
 */
const deleteImageHandler = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    throw ApiError.badRequest('publicId is required', 'PUBLIC_ID_REQUIRED');
  }

  await deleteImage(publicId);

  res.status(200).json(new ApiResponse(200, null, 'Image deleted successfully'));
});

module.exports = { uploadSingleImageHandler, uploadMultipleImagesHandler, deleteImageHandler };
