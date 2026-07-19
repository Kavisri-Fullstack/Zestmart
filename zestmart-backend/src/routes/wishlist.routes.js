const express = require('express');
const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} = require('../controllers/wishlist.controller');
const validate = require('../middlewares/validate');
const {
  addWishlistItemSchema,
  wishlistItemParamSchema,
} = require('../validators/wishlist.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every wishlist route requires a logged-in user.
router.use(protect);

// GET /api/v1/wishlist
router.get('/', getWishlist);

// POST /api/v1/wishlist/items
router.post('/items', validate(addWishlistItemSchema), addWishlistItem);

// DELETE /api/v1/wishlist/items/:productId
router.delete('/items/:productId', validate(wishlistItemParamSchema), removeWishlistItem);

module.exports = router;
