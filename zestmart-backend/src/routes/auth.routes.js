const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  googleAuth,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/auth.controller');
const {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/v1/auth/google
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// POST /api/v1/auth/forgot-password — strictly rate-limited (sends an email)
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);

// POST /api/v1/auth/verify-otp — strictly rate-limited (guards against code brute-forcing)
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtp);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// GET /api/v1/auth/me
router.get('/me', protect, getMe);

module.exports = router;
