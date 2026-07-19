const express = require('express');
const { getProductReviews, createReview } = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const { createReviewSchema, productIdParamSchema } = require('../validators/review.validator');
const { protect } = require('../middlewares/auth');

// mergeParams so this router (mounted at /products/:productId/reviews)
// can read req.params.productId from the parent path.
const router = express.Router({ mergeParams: true });

// GET /api/v1/products/:productId/reviews
router.get('/', validate(productIdParamSchema), getProductReviews);

// POST /api/v1/products/:productId/reviews
router.post('/', protect, validate(createReviewSchema), createReview);

module.exports = router;
