const { logAdminActivity } = require('../services/adminActivity.service');

/**
 * Attaches audit logging to a route with a single line, e.g.:
 *   router.post('/', validate(schema), auditLog('coupon.create', 'Coupon'), createCoupon);
 *
 * Works by wrapping res.json so it can inspect the response the
 * controller actually sent, AFTER the controller runs — this means it
 * captures the real, final target id (e.g. a newly created document's
 * _id) without needing every controller to manually call
 * logAdminActivity itself. Only logs on success (status < 400) and only
 * when a logged-in admin is attached to the request.
 *
 * Target id resolution order:
 *   1. req.params.id (covers update/delete routes)
 *   2. The first `_id` found on the response's `data` object (covers
 *      create routes, where the new document is returned as
 *      { data: { coupon: {...} } } etc — matches this project's
 *      consistent ApiResponse shape)
 */
const extractTargetId = (req, body) => {
  if (req.params?.id) return req.params.id;

  const data = body?.data;
  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0];
    if (firstValue && typeof firstValue === 'object' && firstValue._id) {
      return firstValue._id;
    }
  }
  return null;
};

const auditLog = (action, targetType) => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode < 400 && req.user) {
      const targetId = extractTargetId(req, body);
      logAdminActivity({
        adminId: req.user._id,
        action,
        targetType,
        targetId,
        details: { method: req.method, path: req.originalUrl, body: req.body },
        ip: req.ip,
      }); // fire-and-forget — logAdminActivity never throws
    }
    return originalJson(body);
  };

  next();
};

module.exports = auditLog;
