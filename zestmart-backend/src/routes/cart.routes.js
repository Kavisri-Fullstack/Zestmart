const express = require('express');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cart.controller');
const validate = require('../middlewares/validate');
const {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema,
} = require('../validators/cart.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every cart route requires a logged-in user.
router.use(protect);

// GET /api/v1/cart
router.get('/', getCart);

// POST /api/v1/cart/items
router.post('/items', validate(addCartItemSchema), addCartItem);

// PATCH /api/v1/cart/items/:productId
router.patch('/items/:productId', validate(updateCartItemSchema), updateCartItem);

// DELETE /api/v1/cart/items/:productId
router.delete('/items/:productId', validate(cartItemParamSchema), removeCartItem);

// DELETE /api/v1/cart
router.delete('/', clearCart);

module.exports = router;
