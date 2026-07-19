const express = require('express');
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} = require('../validators/category.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const markAdminRoute = require('../middlewares/markAdminRoute');
const { uploadSingleImage } = require('../middlewares/upload');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, restrictTo('admin'), markAdminRoute);

// POST /api/v1/admin/categories
router.post('/', uploadSingleImage, validate(createCategorySchema), auditLog('category.create', 'Category'), createCategory);

// GET /api/v1/admin/categories
router.get('/', getAllCategories);

// PATCH /api/v1/admin/categories/:id
router.patch('/:id', uploadSingleImage, validate(updateCategorySchema), auditLog('category.update', 'Category'), updateCategory);

// DELETE /api/v1/admin/categories/:id
router.delete('/:id', validate(categoryIdParamSchema), auditLog('category.delete', 'Category'), deleteCategory);

module.exports = router;
