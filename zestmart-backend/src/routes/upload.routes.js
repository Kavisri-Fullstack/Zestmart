const express = require('express');
const {
  uploadSingleImageHandler,
  uploadMultipleImagesHandler,
  deleteImageHandler,
} = require('../controllers/upload.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { uploadSingleImage, uploadMultipleImages } = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

// POST /api/v1/uploads/image — any logged-in user (e.g. avatar, review photo)
router.post('/image', uploadSingleImage, uploadSingleImageHandler);

// POST /api/v1/uploads/images — admin only (bulk upload)
router.post('/images', restrictTo('admin'), uploadMultipleImages, uploadMultipleImagesHandler);

// DELETE /api/v1/uploads/image — admin only
router.delete('/image', restrictTo('admin'), deleteImageHandler);

module.exports = router;
