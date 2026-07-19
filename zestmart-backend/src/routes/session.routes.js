const express = require('express');
const { getMySessions, revokeSession, revokeOtherSessions } = require('../controllers/session.controller');
const validate = require('../middlewares/validate');
const { sessionIdParamSchema } = require('../validators/session.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

// GET /api/v1/sessions
router.get('/', getMySessions);

// DELETE /api/v1/sessions/:id
router.delete('/:id', validate(sessionIdParamSchema), revokeSession);

// DELETE /api/v1/sessions — revoke all EXCEPT the current one
router.delete('/', revokeOtherSessions);

module.exports = router;
