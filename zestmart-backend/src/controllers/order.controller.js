const { Order, Payment, Address, Coupon } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateCart, syncCartWithProducts } = require('../services/cart.service');
const { decrementStockForItems, rollbackStock, buildOrderPricing } = require('../services/order.service');
const { generateOrderAndInvoiceNumbers } = require('../utils/orderNumber');
const { verifyPaymentSignature, refundPayment } = require('../services/payment.service');
const { notifyUser } = require('../services/notification.service');
const {
  validateCouponForCart,
  incrementCouponUsage,
  decrementCouponUsage,
} = require('../services/coupon.service');
const { generateInvoicePdf } = require('../services/pdf.service');
const logger = require('../utils/logger');

const ADDRESS_SNAPSHOT_FIELDS = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];

const snapshotAddress = (address) => {
  const snap = {};
  ADDRESS_SNAPSHOT_FIELDS.forEach((field) => {
    snap[field] = address[field];
  });
  return snap;
};

/**
 * POST /api/v1/orders
 * Places an order from the user's current cart. This is the checkout
 * endpoint — matches the spec: recalculates total server-side, validates
 * stock, validates the address, and (for Razorpay) re-verifies the
 * payment signature before ever writing an Order to the database.
 */
const placeOrder = asyncHandler(async (req, res) => {
  const {
    addressId,
    paymentMethod,
    notes,
    couponCode,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    throw ApiError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }

  const cart = await getOrCreateCart(req.user._id);
  const { cart: syncedCart, removedItems } = await syncCartWithProducts(cart);

  if (syncedCart.items.length === 0) {
    throw ApiError.badRequest(
      removedItems.length > 0
        ? 'Some items in your cart are no longer available. Please review your cart and try again.'
        : 'Your cart is empty',
      'CART_EMPTY'
    );
  }

  const pricing = buildOrderPricing(syncedCart);

  // Coupon is validated (and its discount applied to pricing) BEFORE any
  // stock is touched, so a bad/expired code fails fast without needing
  // any rollback at all.
  let appliedCoupon = null;
  if (couponCode) {
    const { coupon, discountAmount } = await validateCouponForCart(couponCode, pricing.subtotal);
    appliedCoupon = coupon;
    pricing.discountAmount = discountAmount;
    pricing.totalAmount =
      Math.round((pricing.subtotal - discountAmount + pricing.shippingFee + pricing.taxAmount) * 100) / 100;
  }

  // For Razorpay, the amount the customer actually paid (via the
  // razorpayOrderId created earlier) must match what the cart totals to
  // NOW. This is re-verified here — not just trusted from the frontend —
  // so a stale or tampered request can never sneak a mismatched charge through.
  if (paymentMethod === 'razorpay') {
    const signatureValid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!signatureValid) {
      throw ApiError.unauthorized('Payment verification failed', 'PAYMENT_VERIFICATION_FAILED');
    }
  }

  // Decrement stock for every item, all-or-nothing (see order.service.js).
  const decremented = await decrementStockForItems(pricing.items);

  // Atomically claim one use of the coupon, AFTER stock succeeded but
  // BEFORE the order is created. Conditional on usedCount < usageLimit,
  // so two customers racing for the last use of a limited coupon can
  // never both succeed (see coupon.service.js). If this fails, stock
  // must be rolled back since nothing else has been written yet.
  if (appliedCoupon) {
    const claimed = await incrementCouponUsage(appliedCoupon._id);
    if (!claimed) {
      await rollbackStock(decremented);
      throw ApiError.badRequest('This coupon has just reached its usage limit. Please remove it and try again.', 'COUPON_EXHAUSTED');
    }
  }

  const { orderNumber, invoiceNumber } = await generateOrderAndInvoiceNumbers();

  let order;
  try {
    order = await Order.create({
      orderNumber,
      invoiceNumber,
      user: req.user._id,
      items: pricing.items,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      shippingFee: pricing.shippingFee,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      orderStatus: 'confirmed',
      shippingAddress: snapshotAddress(address),
      notes: notes || '',
      placedAt: new Date(),
    });
  } catch (err) {
    // Order creation failed after stock (and possibly coupon usage) was
    // already claimed — restore both so the failed checkout doesn't
    // leave inventory short or a coupon slot wasted.
    await rollbackStock(decremented);
    if (appliedCoupon) await decrementCouponUsage(appliedCoupon._id);
    throw err;
  }

  await Payment.create({
    order: order._id,
    user: req.user._id,
    provider: paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
    amount: pricing.totalAmount,
    currency: 'INR',
    status: paymentMethod === 'razorpay' ? 'captured' : 'pending',
    razorpayOrderId: razorpayOrderId || null,
    razorpayPaymentId: razorpayPaymentId || null,
    razorpaySignature: razorpaySignature || null,
    paidAt: paymentMethod === 'razorpay' ? new Date() : null,
  });

  // Checkout succeeded — empty the cart.
  syncedCart.items = [];
  syncedCart.subtotal = 0;
  syncedCart.discountAmount = 0;
  syncedCart.shippingEstimate = 0;
  await syncedCart.save();

  await notifyUser({
    userId: req.user._id,
    type: 'order',
    title: 'Order placed successfully',
    message: `Your order ${order.orderNumber} has been placed and is being processed.`,
    link: `/orders/${order._id}`,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { order, removedItemsDuringCheckout: removedItems },
      'Order placed successfully'
    )
  );
});

/**
 * GET /api/v1/orders
 * Returns the current user's own order history, most recent first.
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const filter = { user: req.user._id };
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-placedAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, orders, 'Orders fetched successfully', {
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
 * Shared ownership check: a regular user may only see their own order;
 * an admin may see any order. Used by getOrderById, cancelOrder,
 * trackOrder, and getInvoice.
 */
const findOwnedOrder = async (orderId, user) => {
  const filter = user.role === 'admin' ? { _id: orderId } : { _id: orderId, user: user._id };
  const order = await Order.findOne(filter);
  if (!order) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }
  return order;
};

/**
 * GET /api/v1/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, { order }, 'Order fetched successfully'));
});

/**
 * PATCH /api/v1/orders/:id/cancel
 * Lets a customer cancel their own order (or an admin cancel any order)
 * while it's still early in its lifecycle. Restores stock, and
 * best-effort refunds a captured Razorpay payment.
 */
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user);

  if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
    throw ApiError.badRequest(
      `Orders that are already "${order.orderStatus}" can no longer be cancelled`,
      'ORDER_NOT_CANCELLABLE'
    );
  }

  await rollbackStock(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));

  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon) await decrementCouponUsage(coupon._id);
  }

  order.orderStatus = 'cancelled';
  order.cancelReason = req.body.reason || null;

  if (order.paymentStatus === 'paid') {
    const payment = await Payment.findOne({ order: order._id }).select('+razorpaySignature');
    if (payment && payment.razorpayPaymentId) {
      const refund = await refundPayment(payment.razorpayPaymentId, order.totalAmount);
      if (refund) {
        payment.status = 'refunded';
        await payment.save();
        order.paymentStatus = 'refunded';
      } else {
        logger.warn(
          `Automatic refund failed for order ${order.orderNumber}; needs manual refund via Razorpay dashboard.`
        );
      }
    }
  }

  await order.save();

  res.status(200).json(new ApiResponse(200, { order }, 'Order cancelled successfully'));
});

/**
 * GET /api/v1/orders/:id/track
 * Returns the order's status plus a simple derived timeline. There's no
 * separate Tracking collection in the spec, so the timeline is computed
 * from orderStatus rather than stored.
 */
const STATUS_TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const trackOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user);

  const isCancelled = order.orderStatus === 'cancelled';
  const currentIndex = STATUS_TIMELINE.indexOf(order.orderStatus);

  const timeline = STATUS_TIMELINE.map((status, index) => ({
    status,
    reached: !isCancelled && index <= currentIndex,
    current: !isCancelled && index === currentIndex,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      trackingNumber: order.trackingNumber,
      isCancelled,
      timeline,
    }, 'Order tracking fetched successfully')
  );
});

/**
 * GET /api/v1/orders/:id/invoice
 * Returns a downloadable PDF invoice by default — this is a behavior
 * change from Phase 5, which returned JSON only (PDF generation wasn't
 * built yet). Pass ?format=json to get the old structured-JSON response
 * instead, for any existing frontend code that was reading that shape.
 */
const getInvoice = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user);

  if (req.query.format === 'json') {
    const invoice = {
      invoiceNumber: order.invoiceNumber,
      orderNumber: order.orderNumber,
      issuedAt: order.createdAt,
      billTo: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
    return res.status(200).json(new ApiResponse(200, { invoice }, 'Invoice fetched successfully'));
  }

  const pdfBuffer = await generateInvoicePdf(order);

  res.status(200);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${order.invoiceNumber}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

// ---------- Admin ----------

/**
 * GET /api/v1/admin/orders
 */
const adminGetAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.user) filter.user = req.query.user;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-placedAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  res.status(200).json(
    new ApiResponse(200, orders, 'Orders fetched successfully', {
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
 * PATCH /api/v1/admin/orders/:id/status
 * Updates order status and, optionally, a tracking number (e.g. once
 * marked "shipped"). No workflow-order enforcement beyond disallowing
 * changes to already-cancelled orders — admins are trusted operators.
 */
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }

  if (order.orderStatus === 'cancelled') {
    throw ApiError.badRequest('This order is cancelled and cannot be updated', 'ORDER_CANCELLED');
  }

  order.orderStatus = orderStatus;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;

  if (orderStatus === 'cancelled') {
    await rollbackStock(order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
  }

  await order.save();

  await notifyUser({
    userId: order.user,
    type: 'order',
    title: `Order ${order.orderNumber} updated`,
    message: `Your order status is now "${orderStatus}"${trackingNumber ? ` (tracking: ${trackingNumber})` : ''}.`,
    link: `/orders/${order._id}`,
  });

  res.status(200).json(new ApiResponse(200, { order }, 'Order status updated successfully'));
});

/**
 * PATCH /api/v1/admin/orders/:id/refund
 * Admin-triggered refund, independent of cancellation (e.g. partial
 * goodwill refund or a return that doesn't cancel the whole order record).
 */
const adminRefundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }

  if (order.paymentStatus !== 'paid') {
    throw ApiError.badRequest('Only paid orders can be refunded', 'ORDER_NOT_PAID');
  }

  const payment = await Payment.findOne({ order: order._id });
  if (!payment || !payment.razorpayPaymentId) {
    throw ApiError.badRequest(
      'No Razorpay payment record found for this order (was it paid via COD?)',
      'NO_PAYMENT_RECORD'
    );
  }

  const refund = await refundPayment(payment.razorpayPaymentId, order.totalAmount);
  if (!refund) {
    throw ApiError.internal('Refund could not be processed automatically. Try again or refund manually via the Razorpay dashboard.', 'REFUND_FAILED');
  }

  payment.status = 'refunded';
  await payment.save();

  order.paymentStatus = 'refunded';
  await order.save();

  res.status(200).json(new ApiResponse(200, { order }, 'Order refunded successfully'));
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
  getInvoice,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminRefundOrder,
};
