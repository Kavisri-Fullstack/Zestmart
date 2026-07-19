/**
 * Marks the request as originating from an admin route. Some controllers
 * (getAllCategories, getCategoryBySlug, getAllProducts, getProductBySlug)
 * are reused by both the public routes and the admin routes; this flag
 * lets them skip the "isActive: true only" restriction for admins without
 * duplicating the entire controller function.
 */
const markAdminRoute = (req, res, next) => {
  req.isAdminRoute = true;
  next();
};

module.exports = markAdminRoute;
