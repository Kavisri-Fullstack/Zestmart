const express = require('express');
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
  getInvoice,
} = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const {
  placeOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
} = require('../validators/order.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Every order route requires a logged-in user.
router.use(protect);

// POST /api/v1/orders
router.post('/', validate(placeOrderSchema), placeOrder);

// GET /api/v1/orders
router.get('/', validate(listOrdersQuerySchema), getMyOrders);

// GET /api/v1/orders/:id
router.get('/:id', validate(orderIdParamSchema), getOrderById);

// PATCH /api/v1/orders/:id/cancel
router.patch('/:id/cancel', validate(cancelOrderSchema), cancelOrder);

// GET /api/v1/orders/:id/track
router.get('/:id/track', validate(orderIdParamSchema), trackOrder);

// GET /api/v1/orders/:id/invoice
router.get('/:id/invoice', validate(orderIdParamSchema), getInvoice);

module.exports = router;
