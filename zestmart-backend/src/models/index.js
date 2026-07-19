/**
 * Central export point for all models, so other files can do:
 *   const { User, Product, Category, Address } = require('../models');
 * instead of importing each model file individually.
 */
const User = require('./user.model');
const Category = require('./category.model');
const Product = require('./product.model');
const Address = require('./address.model');
const Cart = require('./cart.model');
const Wishlist = require('./wishlist.model');
const Order = require('./order.model');
const Payment = require('./payment.model');
const Counter = require('./counter.model');
const Review = require('./review.model');
const Coupon = require('./coupon.model');
const Notification = require('./notification.model');
const Banner = require('./banner.model');
const RecentlyViewed = require('./recentlyViewed.model');
const OTPVerification = require('./otpVerification.model');
const AIRecommendation = require('./aiRecommendation.model');
const AdminActivity = require('./adminActivity.model');
const SupportTicket = require('./supportTicket.model');
const Session = require('./session.model');
const SiteSettings = require('./siteSettings.model');

module.exports = {
  User,
  Category,
  Product,
  Address,
  Cart,
  Wishlist,
  Order,
  Payment,
  Counter,
  Review,
  Coupon,
  Notification,
  Banner,
  RecentlyViewed,
  OTPVerification,
  AIRecommendation,
  AdminActivity,
  SupportTicket,
  Session,
  SiteSettings,
};
