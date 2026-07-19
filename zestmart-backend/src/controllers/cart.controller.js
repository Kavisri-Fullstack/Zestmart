const { Product, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateCart, syncCartWithProducts } = require('../services/cart.service');

/**
 * Keeps User.cartCount in sync with the number of distinct product
 * lines in the cart, matching the denormalized counter on the Users
 * collection described in the spec (used for quick UI badges without
 * needing to load the full cart).
 */
const syncUserCartCount = async (userId, itemCount) => {
  await User.findByIdAndUpdate(userId, { cartCount: itemCount }, { runValidators: false });
};

/**
 * GET /api/v1/cart
 * Returns the current user's cart, re-synced against live product data
 * (price/stock/availability) so what's shown is always accurate.
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { cart: synced, removedItems, adjustedItems } = await syncCartWithProducts(cart);

  await syncUserCartCount(req.user._id, synced.items.length);

  res.status(200).json(
    new ApiResponse(200, { cart: synced, removedItems, adjustedItems }, 'Cart fetched successfully')
  );
});

/**
 * POST /api/v1/cart/items
 * Adds a product to the cart, or increases its quantity if it's
 * already there. Body: productId, quantity (default 1), variant.
 */
const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw ApiError.notFound('Product not found or no longer available', 'PRODUCT_NOT_FOUND');
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find((item) => item.productId.toString() === productId);
  const requestedQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

  if (requestedQuantity > product.stock) {
    throw ApiError.badRequest(
      `Only ${product.stock} unit(s) of "${product.title}" available in stock`,
      'INSUFFICIENT_STOCK'
    );
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
    if (variant !== undefined) existingItem.selectedVariant = variant;
  } else {
    cart.items.push({
      productId: product._id,
      title: product.title,
      image: product.primaryImage || (product.images[0] && product.images[0].url) || null,
      price: product.price,
      quantity,
      selectedVariant: variant || null,
      lineTotal: 0, // recalculated by syncCartWithProducts below
    });
  }

  await cart.save();
  const { cart: synced } = await syncCartWithProducts(cart);
  await syncUserCartCount(req.user._id, synced.items.length);

  res.status(200).json(new ApiResponse(200, { cart: synced }, 'Item added to cart'));
});

/**
 * PATCH /api/v1/cart/items/:productId
 * Updates the quantity (and optionally the variant) of an existing
 * cart line. Use DELETE to remove a line entirely.
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, variant } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.productId.toString() === productId);

  if (!item) {
    throw ApiError.notFound('This product is not in your cart', 'CART_ITEM_NOT_FOUND');
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw ApiError.notFound('Product not found or no longer available', 'PRODUCT_NOT_FOUND');
  }

  if (quantity > product.stock) {
    throw ApiError.badRequest(
      `Only ${product.stock} unit(s) of "${product.title}" available in stock`,
      'INSUFFICIENT_STOCK'
    );
  }

  item.quantity = quantity;
  if (variant !== undefined) item.selectedVariant = variant;

  await cart.save();
  const { cart: synced } = await syncCartWithProducts(cart);
  await syncUserCartCount(req.user._id, synced.items.length);

  res.status(200).json(new ApiResponse(200, { cart: synced }, 'Cart item updated'));
});

/**
 * DELETE /api/v1/cart/items/:productId
 * Removes a single product line from the cart.
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);
  const beforeCount = cart.items.length;
  cart.items = cart.items.filter((i) => i.productId.toString() !== productId);

  if (cart.items.length === beforeCount) {
    throw ApiError.notFound('This product is not in your cart', 'CART_ITEM_NOT_FOUND');
  }

  await cart.save();
  const { cart: synced } = await syncCartWithProducts(cart);
  await syncUserCartCount(req.user._id, synced.items.length);

  res.status(200).json(new ApiResponse(200, { cart: synced }, 'Item removed from cart'));
});

/**
 * DELETE /api/v1/cart
 * Empties the entire cart (e.g. "clear cart" button).
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.subtotal = 0;
  cart.discountAmount = 0;
  cart.shippingEstimate = 0;
  await cart.save();

  await syncUserCartCount(req.user._id, 0);

  res.status(200).json(new ApiResponse(200, { cart }, 'Cart cleared successfully'));
});

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };
