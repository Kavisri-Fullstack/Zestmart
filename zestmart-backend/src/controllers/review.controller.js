const { Review, Product, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateProductRating } = require('../services/review.service');

/**
 * A review is marked "verified purchase" if the reviewing user has any
 * paid or COD order containing this product — a simple, honest signal
 * without needing a separate "eligible to review" workflow.
 */
const checkVerifiedPurchase = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    'items.productId': productId,
    orderStatus: { $ne: 'cancelled' },
  });
  return Boolean(order);
};

/**
 * GET /api/v1/products/:productId/reviews
 * Public — only ever shows reviews with status "visible".
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const filter = { product: req.params.productId, status: 'visible' };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, reviews, 'Reviews fetched successfully', {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  );
});

/**
 * POST /api/v1/products/:productId/reviews
 * One review per user per product — the unique index on (user, product)
 * is the ultimate guard, but we check first to return a friendly 409
 * instead of a raw duplicate-key error.
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment, images } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product. Edit your existing review instead.', 'REVIEW_ALREADY_EXISTS');
  }

  const isVerifiedPurchase = await checkVerifiedPurchase(req.user._id, productId);

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment: comment || '',
    images: images || [],
    isVerifiedPurchase,
  });

  await recalculateProductRating(productId);

  res.status(201).json(new ApiResponse(201, { review }, 'Review submitted successfully'));
});

/**
 * PATCH /api/v1/reviews/:id
 * A user may only edit their own review; an admin may edit any (e.g. to
 * moderate status).
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only edit your own review', 'FORBIDDEN');
  }

  const { rating, comment, images } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  await recalculateProductRating(review.product);

  res.status(200).json(new ApiResponse(200, { review }, 'Review updated successfully'));
});

/**
 * DELETE /api/v1/reviews/:id
 * Owner or admin.
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own review', 'FORBIDDEN');
  }

  const { product } = review;
  await review.deleteOne();
  await recalculateProductRating(product);

  res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview };
