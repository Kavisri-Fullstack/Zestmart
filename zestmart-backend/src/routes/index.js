const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const adminCategoryRoutes = require('./admin.category.routes');
const adminProductRoutes = require('./admin.product.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const orderRoutes = require('./order.routes');
const adminOrderRoutes = require('./admin.order.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const reviewStandaloneRoutes = require('./reviewStandalone.routes');
const couponRoutes = require('./coupon.routes');
const adminCouponRoutes = require('./admin.coupon.routes');
const notificationRoutes = require('./notification.routes');
const bannerRoutes = require('./banner.routes');
const adminBannerRoutes = require('./admin.banner.routes');
const addressRoutes = require('./address.routes');
const searchRoutes = require('./search.routes');
const recommendationsRoutes = require('./recommendations.routes');
const recentlyViewedRoutes = require('./recentlyViewed.routes');
const adminDashboardRoutes = require('./admin.dashboard.routes');
const uploadRoutes = require('./upload.routes');
const adminUserRoutes = require('./admin.user.routes');
const supportTicketRoutes = require('./supportTicket.routes');
const adminSupportTicketRoutes = require('./admin.supportTicket.routes');
const sessionRoutes = require('./session.routes');
const siteSettingsRoutes = require('./siteSettings.routes');
const adminSiteSettingsRoutes = require('./admin.siteSettings.routes');
const adminActivityLogRoutes = require('./admin.activityLog.routes');

const router = express.Router();

/**
 * All feature routers get mounted here, matching the REST API Design
 * section of the spec plus the optional production modules added in
 * the Final (Production) Phase.
 *
 * Phase 1 wired up the health check.
 * Phase 2 added Auth.
 * Phase 3 added public Category/Product browsing plus Admin CRUD for both.
 * Phase 4 added Cart and Wishlist.
 * Phase 5 added Orders, Checkout, and Razorpay Payments.
 * Phase 6 added Reviews, Coupons, Notifications, Banners, Addresses,
 * Search/Recommendations, and Admin Dashboard Analytics.
 * Phase 7 added Google Sign-In, OTP-based email verification and
 * password reset, standalone Upload APIs, and Admin User Management.
 * Final (Production) Phase adds: coupon-integrated checkout, PDF
 * invoices, Swagger/OpenAPI docs (see app.js), AIRecommendation-backed
 * recommendations, and the optional modules: Support Tickets, Sessions
 * (device/refresh-token management), Site Settings, and Admin Activity
 * Logs (audit trail).
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/payments', paymentRoutes);
router.use('/products/:productId/reviews', reviewRoutes);
router.use('/reviews', reviewStandaloneRoutes);
router.use('/coupons', couponRoutes);
router.use('/admin/coupons', adminCouponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/banners', bannerRoutes);
router.use('/admin/banners', adminBannerRoutes);
router.use('/addresses', addressRoutes);
router.use('/search', searchRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/recently-viewed', recentlyViewedRoutes);
router.use('/uploads', uploadRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/support-tickets', supportTicketRoutes);
router.use('/admin/support-tickets', adminSupportTicketRoutes);
router.use('/sessions', sessionRoutes);
router.use('/site-settings', siteSettingsRoutes);
router.use('/admin/site-settings', adminSiteSettingsRoutes);
router.use('/admin/activity-logs', adminActivityLogRoutes);
router.use('/admin', adminDashboardRoutes);

module.exports = router;
