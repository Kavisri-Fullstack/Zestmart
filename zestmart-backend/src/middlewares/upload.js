const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * Multer is configured with memory storage (not disk storage) because
 * files are streamed straight to Cloudinary and never need to touch
 * the server's disk. `req.file.buffer` / `req.files[i].buffer` holds
 * the raw bytes that src/services/cloudinary.service.js uploads.
 */
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, AVIF.`,
        'INVALID_FILE_TYPE'
      )
    );
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 10 },
});

// Single image field named "image" (e.g. category image, avatar).
const uploadSingleImage = upload.single('image');

// Multiple images field named "images" (e.g. product gallery, up to 10).
const uploadMultipleImages = upload.array('images', 10);

// Two distinct named fields (e.g. banner desktop + mobile images).
// req.files.image[0] and req.files.mobileImage[0] hold the buffers.
const uploadBannerImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]);

module.exports = { uploadSingleImage, uploadMultipleImages, uploadBannerImages };
