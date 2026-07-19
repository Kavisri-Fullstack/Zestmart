const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Attempts to decrement stock for every cart item in sequence. Each
 * decrement uses a conditional update (`stock: { $gte: quantity }`) so
 * two simultaneous checkouts can never push a product's stock negative
 * — this is safe even without a replica-set transaction, because each
 * individual update is still atomic at the document level.
 *
 * If any item fails (someone else bought the last units first), every
 * previously-decremented item in this same checkout is rolled back and
 * an ApiError is thrown, so the checkout either fully succeeds or fully
 * fails — never leaves stock half-decremented.
 *
 * Note: a multi-document ACID transaction (mongoose session) would be
 * the gold-standard approach and works if your MongoDB is a replica
 * set (Atlas always is), but this rollback approach works identically
 * on any MongoDB deployment, including plain standalone instances,
 * which keeps the project easy to run locally too.
 */
const decrementStockForItems = async (items) => {
  const decremented = [];

  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      // eslint-disable-next-line no-await-in-loop
      await rollbackStock(decremented);
      throw ApiError.badRequest(
        `"${item.title}" no longer has enough stock to fulfil this order`,
        'INSUFFICIENT_STOCK'
      );
    }

    decremented.push(item);
  }

  return decremented;
};

/**
 * Restores stock for a list of items — used both for rollback during a
 * failed checkout and for restoring stock when an order is cancelled.
 */
const rollbackStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }).catch((err) => {
        // Restoring stock is best-effort during rollback; log rather than
        // throw, since throwing here would mask the original error.
        logger.error(`Failed to restore stock for product ${item.productId}: ${err.message}`);
      })
    )
  );
};

/**
 * Builds the order-item snapshots and price totals from a (already
 * live-synced) cart, matching the Orders collection's schema exactly.
 * Pure calculation — does not touch the database.
 */
const buildOrderPricing = (cart) => {
  const items = cart.items.map((item) => ({
    productId: item.productId,
    title: item.title,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    variant: item.selectedVariant,
    lineTotal: item.lineTotal,
  }));

  const subtotal = cart.subtotal;
  const discountAmount = cart.discountAmount || 0;
  const shippingFee = cart.shippingEstimate || 0;
  const taxAmount = 0; // no tax engine yet — placeholder for a future phase
  const totalAmount =
    Math.round((subtotal - discountAmount + shippingFee + taxAmount) * 100) / 100;

  return { items, subtotal, discountAmount, shippingFee, taxAmount, totalAmount };
};

module.exports = { decrementStockForItems, rollbackStock, buildOrderPricing };
