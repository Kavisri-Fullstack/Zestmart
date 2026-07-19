const express = require('express');
const { updateReview, deleteReview } = require('../controllers/review.controller');
const validate = require('../middlewares/validate');
const { updateReviewSchema, reviewIdParamSchema } = require('../validators/review.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every review-editing route requires a logged-in user (ownership is
// checked inside the controller, admins may act on any review).
router.use(protect);

// PATCH /api/v1/reviews/:id
router.patch('/:id', validate(updateReviewSchema), updateReview);

// DELETE /api/v1/reviews/:id
router.delete('/:id', validate(reviewIdParamSchema), deleteReview);

module.exports = router;
