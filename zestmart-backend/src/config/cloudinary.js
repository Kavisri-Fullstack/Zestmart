const cloudinary = require('cloudinary').v2;
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Cloudinary is configured once here and reused across the app
 * (product images, avatars, banners, review images).
 * Actual upload logic lives in src/services/cloudinary.service.js (Phase 2+).
 */
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
  logger.warn(
    'Cloudinary credentials are missing or incomplete. Image upload endpoints will fail until CLOUDINARY_* env vars are set.'
  );
}

module.exports = cloudinary;
