const { Product } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const {
  getRecommendationsForUser,
  getRecentlyViewedForUser,
} = require('../services/recommendation.service');

/**
 * GET /api/v1/search/suggestions
 * Public. Lightweight autocomplete — a handful of matching titles for a
 * dropdown as the user types, NOT the full search-results experience
 * (that's /search/products below). Kept intentionally small/fast:
 * only title + slug + image, no pagination, capped at 8 results.
 * Rate-limited strictly at the route level (see search.routes.js).
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();

  if (q.length < 2) {
    return res.status(200).json(new ApiResponse(200, { suggestions: [] }, 'Suggestions fetched successfully'));
  }

  const suggestions = await Product.find({
    isActive: true,
    title: { $regex: q, $options: 'i' },
  })
    .select('title slug primaryImage price')
    .limit(8);

  res.status(200).json(new ApiResponse(200, { suggestions }, 'Suggestions fetched successfully'));
});

/**
 * GET /api/v1/search/products
 * Public. The full search-results page — reuses the exact same
 * ApiFeatures pipeline (search/filter/sort/paginate) that powers
 * GET /products, since a "search results" page and a "filtered product
 * list" page are the same underlying query with a `q` term attached.
 * Kept as its own endpoint (rather than just documenting "use /products
 * ?q=...") to match the spec's explicit Search APIs section.
 */
const searchProducts = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(
    Product.find({ isActive: true }).populate('category', 'name slug'),
    req.query
  )
    .search(['title', 'tags', 'brand'])
    .filter()
    .sort()
    .paginate();

  // Public search must never leak inactive products, same rule as
  // GET /products (see Phase 3's isActive bypass fix).
  features.filterConditions.isActive = true;
  features.query = features.query.find({ isActive: true });

  const [products, meta] = await Promise.all([features.query, features.getMeta(Product)]);

  res.status(200).json(new ApiResponse(200, products, 'Search results fetched successfully', meta));
});

/**
 * GET /api/v1/recommendations
 * Auth: User. Personalized "recommended for you" — served from a cached
 * AIRecommendations snapshot when available (see recommendation.service.js),
 * regenerated via rule-based logic (recently-viewed categories) otherwise.
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 30);
  const { products, basis, cached } = await getRecommendationsForUser(req.user._id, limit);

  res
    .status(200)
    .json(new ApiResponse(200, { products, basis, cached }, 'Recommendations fetched successfully'));
});

/**
 * GET /api/v1/recently-viewed
 * Auth: User.
 */
const getRecentlyViewed = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const recentlyViewed = await getRecentlyViewedForUser(req.user._id, limit);

  res
    .status(200)
    .json(new ApiResponse(200, { recentlyViewed }, 'Recently viewed products fetched successfully'));
});

module.exports = { getSuggestions, searchProducts, getRecommendations, getRecentlyViewed };
