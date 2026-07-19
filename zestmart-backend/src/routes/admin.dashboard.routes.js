const express = require('express');
const {
  getDashboardSummary,
  getSalesAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  getLowStockProducts,
} = require('../controllers/admin.dashboard.controller');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

// GET /api/v1/admin/dashboard
router.get('/dashboard', getDashboardSummary);

// GET /api/v1/admin/analytics/sales
router.get('/analytics/sales', getSalesAnalytics);

// GET /api/v1/admin/analytics/products
router.get('/analytics/products', getProductAnalytics);

// GET /api/v1/admin/analytics/users
router.get('/analytics/users', getUserAnalytics);

// GET /api/v1/admin/inventory/low-stock
router.get('/inventory/low-stock', getLowStockProducts);

module.exports = router;
