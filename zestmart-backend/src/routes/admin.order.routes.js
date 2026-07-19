const express = require('express');
const {
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminRefundOrder,
} = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const {
  updateOrderStatusSchema,
  refundOrderSchema,
  listOrdersQuerySchema,
} = require('../validators/order.validator');
const { protect, restrictTo } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

const router = express.Router();

// Every admin order route requires a logged-in admin.
router.use(protect, restrictTo('admin'));

// GET /api/v1/admin/orders
router.get('/', validate(listOrdersQuerySchema), adminGetAllOrders);

// PATCH /api/v1/admin/orders/:id/status
router.patch('/:id/status', validate(updateOrderStatusSchema), auditLog('order.status_update', 'Order'), adminUpdateOrderStatus);

// PATCH /api/v1/admin/orders/:id/refund
router.patch('/:id/refund', validate(refundOrderSchema), auditLog('order.refund', 'Order'), adminRefundOrder);

module.exports = router;
