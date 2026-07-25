const { Product, User, Wishlist } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Finds a user's wishlist, creating an empty one if it doesn't exist yet.
 */
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
};

/**
 * Keeps User.wishlistCount in sync with the number of saved items,
 * matching the denormalized counter on the Users collection.
 */
const syncUserWishlistCount = async (userId, itemCount) => {
  await User.findByIdAndUpdate(userId, { wishlistCount: itemCount }, { runValidators: false });
};

/**
 * GET /api/v1/wishlist
 * Returns the current user's wishlist with each item's product details
 * populated, so the frontend doesn't need a second round trip.
 */
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);

  const populated = await wishlist.populate({
    path: 'items.productId',
    select: 'title slug price primaryImage images isActive ratingAverage',
  });

  // Drop items whose product was deleted, so the response never shows
  // broken/null product references to the frontend.
  const validItems = populated.items.filter((item) => item.productId);
  if (validItems.length !== populated.items.length) {
    populated.items = validItems;
    await populated.save();
    await syncUserWishlistCount(req.user._id, validItems.length);
  }

  res.status(200).json(new ApiResponse(200, { wishlist: populated }, 'Wishlist fetched successfully'));
});

/**
 * POST /api/v1/wishlist/items
 * Adds a product to the wishlist. Body: productId, note (optional).
 * Adding a product that's already saved is a no-op (not an error) —
 * simply returns the wishlist unchanged, matching typical "save" UX.
 */
const addWishlistItem = asyncHandler(async (req, res) => {
  const { productId, note } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }

  const wishlist = await getOrCreateWishlist(req.user._id);

  const alreadySaved = wishlist.items.some((item) => item.productId.toString() === productId);
  if (!alreadySaved) {
    wishlist.items.push({ productId, note: note || '', addedAt: new Date() });
    await wishlist.save();
    await syncUserWishlistCount(req.user._id, wishlist.items.length);
  }

  await wishlist.populate({
    path: 'items.productId',
    select: 'title slug price primaryImage images isActive ratingAverage',
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { wishlist },
        alreadySaved ? 'Product is already in your wishlist' : 'Product added to wishlist'
      )
    );
});

/**
 * DELETE /api/v1/wishlist/items/:productId
 * Removes a product from the wishlist.
 */
const removeWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await getOrCreateWishlist(req.user._id);
  const beforeCount = wishlist.items.length;
  wishlist.items = wishlist.items.filter((item) => item.productId.toString() !== productId);

  if (wishlist.items.length === beforeCount) {
    throw ApiError.notFound('This product is not in your wishlist', 'WISHLIST_ITEM_NOT_FOUND');
  }

  await wishlist.save();
  await syncUserWishlistCount(req.user._id, wishlist.items.length);

  await wishlist.populate({
    path: 'items.productId',
    select: 'title slug price primaryImage images isActive ratingAverage',
  });

  res.status(200).json(new ApiResponse(200, { wishlist }, 'Product removed from wishlist'));
});

module.exports = { getWishlist, addWishlistItem, removeWishlistItem };