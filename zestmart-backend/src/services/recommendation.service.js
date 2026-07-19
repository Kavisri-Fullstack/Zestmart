const { RecentlyViewed, Product, AIRecommendation } = require('../models');

const RECENTLY_VIEWED_LIMIT = 20;
const SNAPSHOT_TTL_HOURS = 24;

/**
 * Records that a user viewed a product. Upserts so viewing the same
 * product again just bumps `viewedAt` instead of creating duplicates,
 * matching the unique (user, product) index on RecentlyViewed.
 *
 * Invalidates any cached AIRecommendation snapshot for this user, since
 * a fresh view means "recently viewed categories" may have changed —
 * the next /recommendations call should reflect it, not serve a stale
 * cached list from before this view happened.
 */
const trackProductView = async (userId, productId) => {
  await RecentlyViewed.findOneAndUpdate(
    { user: userId, product: productId },
    { viewedAt: new Date() },
    { upsert: true }
  );
  await AIRecommendation.deleteMany({ user: userId });
};

/**
 * The actual recommendation LOGIC (separate from caching, below).
 * Simple, explainable, rule-based (not a trained model):
 *
 *   1. Look at the user's most recently viewed products.
 *   2. Collect the categories those products belong to.
 *   3. Recommend other active products from those same categories,
 *      excluding anything already viewed.
 *   4. If the user has no view history yet, fall back to featured products.
 *
 * This is intentionally swappable: a future real ML model only needs
 * to replace the body of this one function (and populate
 * AIRecommendation the same way) — nothing about the caching layer,
 * the API route, or the response shape would need to change.
 */
const generateRecommendations = async (userId, limit) => {
  const recentViews = await RecentlyViewed.find({ user: userId })
    .sort('-viewedAt')
    .limit(RECENTLY_VIEWED_LIMIT)
    .populate('product', 'category');

  const viewedProductIds = recentViews.map((rv) => rv.product?._id).filter(Boolean);
  const categoryIds = [
    ...new Set(recentViews.map((rv) => rv.product?.category?.toString()).filter(Boolean)),
  ];

  if (categoryIds.length === 0) {
    const featured = await Product.find({ isActive: true, isFeatured: true })
      .limit(limit)
      .select('_id');
    return { productIds: featured.map((p) => p._id), sourceType: 'featured_fallback' };
  }

  const recommended = await Product.find({
    isActive: true,
    category: { $in: categoryIds },
    _id: { $nin: viewedProductIds },
  })
    .sort('-ratingAverage -isFeatured')
    .limit(limit)
    .select('_id');

  return { productIds: recommended.map((p) => p._id), sourceType: 'recently_viewed' };
};

/**
 * GET /recommendations backing logic. Checks for a still-valid
 * AIRecommendation snapshot first (matches the spec's collection
 * exactly: user, sourceType, productIds, score, generatedAt, expiresAt)
 * — if found, serves it directly (fast, no recomputation). Otherwise
 * generates a fresh list via generateRecommendations() above, persists
 * it as a new snapshot (expiring after 24h or on the next tracked view,
 * whichever comes first), and returns it.
 */
const getRecommendationsForUser = async (userId, limit = 10) => {
  const cached = await AIRecommendation.findOne({ user: userId }).sort('-generatedAt');

  if (cached && cached.expiresAt > new Date()) {
    const products = await Product.find({ _id: { $in: cached.productIds }, isActive: true })
      .populate('category', 'name slug');
    return { products, basis: cached.sourceType, cached: true };
  }

  const { productIds, sourceType } = await generateRecommendations(userId, limit);

  await AIRecommendation.create({
    user: userId,
    sourceType,
    productIds,
    score: sourceType === 'recently_viewed' ? 0.6 : 0.3,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000),
  });

  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).populate(
    'category',
    'name slug'
  );

  return { products, basis: sourceType, cached: false };
};

/**
 * Fetches the user's recently-viewed products, most recent first.
 */
const getRecentlyViewedForUser = async (userId, limit = 20) => {
  const recentViews = await RecentlyViewed.find({ user: userId })
    .sort('-viewedAt')
    .limit(limit)
    .populate({
      path: 'product',
      select: 'title slug price primaryImage ratingAverage isActive',
    });

  return recentViews.filter((rv) => rv.product);
};

module.exports = { trackProductView, getRecommendationsForUser, getRecentlyViewedForUser };
