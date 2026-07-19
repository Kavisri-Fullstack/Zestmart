/**
 * Centralized environment configuration.
 * Every other file should read config from here instead of
 * calling process.env directly. This makes it easy to validate
 * required variables in one place and fail fast on boot.
 */

require('dotenv').config();

const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.error(
    `\n[FATAL] Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in the values before starting the server.\n'
  );
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',

  mongoUri: process.env.MONGODB_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieName: process.env.JWT_COOKIE_NAME || 'zm_refresh_token',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'ZestMart <no-reply@zestmart.com>',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
    otpMax: parseInt(process.env.OTP_RATE_LIMIT_MAX, 10) || 5,
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
};

module.exports = env;
