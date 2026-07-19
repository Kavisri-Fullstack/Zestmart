const { Order, Product, User, Review } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const LOW_STOCK_THRESHOLD = 10;

/**
 * GET /api/v1/admin/dashboard
 * A single "at a glance" summary — total revenue/orders/users/products
 * plus a handful of recent orders, sized for a dashboard's top cards.
 * Runs everything in parallel since these are independent counts.
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalUsers,
    totalProducts,
    revenueAgg,
    pendingOrders,
    lowStockCount,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
    Product.countDocuments({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } }),
    Order.find().populate('user', 'name email').sort('-placedAt').limit(5),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue: revenueAgg[0]?.total || 0,
        pendingOrders,
        lowStockCount,
        recentOrders,
      },
      'Dashboard summary fetched successfully'
    )
  );
});

/**
 * GET /api/v1/admin/analytics/sales
 * Revenue and order-count grouped by day, over an optional date range
 * (defaults to the last 30 days). Powers a sales-over-time chart.
 */
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sales = await Order.aggregate([
    {
      $match: {
        placedAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt' } },
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, orderCount: 1 } },
  ]);

  res.status(200).json(
    new ApiResponse(200, { startDate, endDate, sales }, 'Sales analytics fetched successfully')
  );
});

/**
 * GET /api/v1/admin/analytics/products
 * Best-selling products by total units sold across all non-cancelled
 * orders, plus each product's current rating for context.
 */
const getProductAnalytics = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const topSelling = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        title: { $first: '$items.title' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
    { $project: { _id: 0, productId: '$_id', title: 1, unitsSold: 1, revenue: 1 } },
  ]);

  const [totalActive, totalOutOfStock, lowStock] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    Product.countDocuments({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD, $gt: 0 } }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { topSelling, totalActive, totalOutOfStock, lowStock },
      'Product analytics fetched successfully'
    )
  );
});

/**
 * GET /api/v1/admin/analytics/users
 * New signups grouped by day (last 30 days by default) plus a simple
 * split of users by role/status.
 */
const getUserAnalytics = asyncHandler(async (req, res) => {
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [signupsByDay, statusBreakdown] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', newUsers: 1 } },
    ]),
    User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { startDate, endDate, signupsByDay, statusBreakdown },
      'User analytics fetched successfully'
    )
  );
});

/**
 * GET /api/v1/admin/inventory/low-stock
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = Math.max(parseInt(req.query.threshold, 10) || LOW_STOCK_THRESHOLD, 0);

  const products = await Product.find({ isActive: true, stock: { $lte: threshold } })
    .select('title slug stock price primaryImage category')
    .populate('category', 'name')
    .sort('stock');

  res.status(200).json(
    new ApiResponse(200, { threshold, count: products.length, products }, 'Low stock products fetched successfully')
  );
});

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  getLowStockProducts,
};
