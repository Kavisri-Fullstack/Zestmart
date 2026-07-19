const express = require('express');
const {
  getAllProducts,
  getProductBySlug,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
} = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const { optionalAuth } = require('../middlewares/auth');
const {
  listProductsQuerySchema,
  productSlugParamSchema,
  productIdParamSchema,
} = require('../validators/product.validator');

const router = express.Router();

// IMPORTANT: specific paths (featured, trending, etc.) must be registered
// BEFORE the generic "/:slug" route, or Express would treat "featured"
// itself as a slug and never reach these handlers.

// GET /api/v1/products/featured
router.get('/featured', getFeaturedProducts);

// GET /api/v1/products/trending
router.get('/trending', getTrendingProducts);

// GET /api/v1/products/bestsellers
router.get('/bestsellers', getBestSellers);

// GET /api/v1/products/new-arrivals
router.get('/new-arrivals', getNewArrivals);

// GET /api/v1/products/:id/related
router.get('/:id/related', validate(productIdParamSchema), getRelatedProducts);

// GET /api/v1/products
router.get('/', validate(listProductsQuerySchema), getAllProducts);

// GET /api/v1/products/:slug
router.get('/:slug', optionalAuth, validate(productSlugParamSchema), getProductBySlug);

module.exports = router;
