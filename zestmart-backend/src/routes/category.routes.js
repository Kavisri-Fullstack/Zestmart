const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryProducts,
} = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { categorySlugParamSchema } = require('../validators/category.validator');

const router = express.Router();

// GET /api/v1/categories
router.get('/', getAllCategories);

// GET /api/v1/categories/:slug
router.get('/:slug', validate(categorySlugParamSchema), getCategoryBySlug);

// GET /api/v1/categories/:slug/products
router.get('/:slug/products', validate(categorySlugParamSchema), getCategoryProducts);

module.exports = router;
