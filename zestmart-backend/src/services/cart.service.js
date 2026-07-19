const { Cart, Product } = require('../models');

const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 49;

/**
 * Finds a user's cart, creating an empty one if it doesn't exist yet.
 * Every user has exactly one cart (enforced by the unique index),
 * so this is the standard "get or create" pattern used by every
 * cart controller action.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const calcShippingEstimate = (subtotal) =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;

/**
 * Re-syncs a cart's items against the current state of the Product
 * collection. This keeps the cart honest as a "live shopping intent"
 * view (unlike an Order, which is a frozen snapshot):
 *   - Removes items whose product was deleted or deactivated.
 *   - Caps quantity down if stock has since dropped below what's in the cart.
 *   - Refreshes the stored title/image/price snapshot from the live product.
 *   - Recalculates each line's lineTotal and the cart's subtotal + shippingEstimate.
 *
 * Returns { cart, removedItems, adjustedItems } so the controller can
 * tell the user if anything changed since they last looked at their cart.
 */
const syncCartWithProducts = async (cart) => {
  if (cart.items.length === 0) {
    cart.subtotal = 0;
    cart.shippingEstimate = 0;
    await cart.save();
    return { cart, removedItems: [], adjustedItems: [] };
  }

  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const removedItems = [];
  const adjustedItems = [];
  const keptItems = [];

  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());

    if (!product || !product.isActive) {
      removedItems.push({ productId: item.productId, title: item.title, reason: 'no_longer_available' });
      continue;
    }

    let { quantity } = item;
    if (product.stock < quantity) {
      adjustedItems.push({
        productId: item.productId,
        title: product.title,
        requestedQuantity: quantity,
        adjustedQuantity: product.stock,
        reason: 'insufficient_stock',
      });
      quantity = product.stock;
    }

    if (quantity <= 0) {
      removedItems.push({ productId: item.productId, title: product.title, reason: 'out_of_stock' });
      continue;
    }

    keptItems.push({
      productId: product._id,
      title: product.title,
      image: product.primaryImage || (product.images[0] && product.images[0].url) || null,
      price: product.price,
      quantity,
      selectedVariant: item.selectedVariant,
      lineTotal: Math.round(product.price * quantity * 100) / 100,
    });
  }

  cart.items = keptItems;
  cart.subtotal = Math.round(keptItems.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  cart.shippingEstimate = calcShippingEstimate(cart.subtotal - cart.discountAmount);

  await cart.save();

  return { cart, removedItems, adjustedItems };
};

module.exports = { getOrCreateCart, syncCartWithProducts, calcShippingEstimate };
