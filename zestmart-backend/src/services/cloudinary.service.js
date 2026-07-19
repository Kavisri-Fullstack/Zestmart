const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Uploads a single in-memory file buffer (from Multer's memoryStorage)
 * to Cloudinary using an upload stream, since there's no file on disk
 * to point Cloudinary's normal `upload()` at.
 *
 * @param {Buffer} buffer - raw file bytes (req.file.buffer / req.files[i].buffer)
 * @param {string} folder - Cloudinary folder, e.g. "zestmart/products"
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

/**
 * Uploads one image and wraps Cloudinary/network failures in an ApiError
 * so callers don't need to know Cloudinary's error shape.
 */
const uploadImage = async (file, folder) => {
  try {
    return await uploadBufferToCloudinary(file.buffer, folder);
  } catch (err) {
    throw ApiError.internal(`Image upload failed: ${err.message}`, 'UPLOAD_FAILED');
  }
};

/**
 * Uploads multiple images in parallel. Used for product galleries.
 */
const uploadImages = async (files, folder) => {
  try {
    return await Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer, folder)));
  } catch (err) {
    throw ApiError.internal(`Image upload failed: ${err.message}`, 'UPLOAD_FAILED');
  }
};

/**
 * Deletes an image from Cloudinary by its public ID. Used when a
 * category/product image is replaced or the record is deleted.
 * Failures are logged-worthy but shouldn't block the main operation,
 * so callers may choose to swallow errors from this if desired.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw ApiError.internal(`Image deletion failed: ${err.message}`, 'DELETE_FAILED');
  }
};

module.exports = { uploadImage, uploadImages, deleteImage };
