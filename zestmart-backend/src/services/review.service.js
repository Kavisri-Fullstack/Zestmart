const { Review, Product } = require('../models');

/**
 * Recalculates ratingAverage/ratingCount/reviewCount on a Product from
 * its VISIBLE reviews, using MongoDB's aggregation pipeline (one query,
 * done in the database, rather than pulling every review into Node).
 * Called after every review create/update/delete so the product's
 * denormalized rating fields never drift out of sync.
 */
const recalculateProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: productId, status: 'visible' } },
    {
      $group: {
        _id: '$product',
        ratingAverage: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: stats ? Math.round(stats.ratingAverage * 10) / 10 : 0,
    ratingCount: stats ? stats.ratingCount : 0,
    reviewCount: stats ? stats.ratingCount : 0,
  });
};

module.exports = { recalculateProductRating };
