const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStock,
} = require('../controllers/product.controller');
const validate = require('../middlewares/validate');
const {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  updateStockSchema,
  listProductsQuerySchema,
} = require('../validators/product.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const markAdminRoute = require('../middlewares/markAdminRoute');
const { uploadMultipleImages } = require('../middlewares/upload');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

// Every route below requires a logged-in admin.
router.use(protect, restrictTo('admin'), markAdminRoute);

// POST /api/v1/admin/products
router.post('/', uploadMultipleImages, validate(createProductSchema), createProduct);

// GET /api/v1/admin/products
router.get('/', validate(listProductsQuerySchema), getAllProducts);

// GET /api/v1/admin/products/:id
router.get('/:id', validate(productIdParamSchema), getProductById);

// PATCH /api/v1/admin/products/:id
router.patch('/:id', uploadMultipleImages, validate(updateProductSchema), auditLog('product.update', 'Product'), updateProduct);

// PATCH /api/v1/admin/products/:id/stock
router.patch('/:id/stock', validate(updateStockSchema), auditLog('product.stock_update', 'Product'), updateProductStock);

// DELETE /api/v1/admin/products/:id
router.delete('/:id', validate(productIdParamSchema), deleteProduct);

module.exports = router;
