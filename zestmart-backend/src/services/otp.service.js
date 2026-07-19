const bcrypt = require('bcryptjs');
const { OTPVerification } = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { sendOtpEmail, isSmtpConfigured } = require('./email.service');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const generateOtpCode = () => {
  // 6-digit numeric code, zero-padded (e.g. "042817").
  const code = Math.floor(Math.random() * 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
  return code;
};

/**
 * Creates and "sends" a new OTP for a given email + purpose. Any
 * previous, still-unverified OTPs for the same email + purpose are
 * invalidated first (deleted) so only the most recently sent code is
 * ever valid — this prevents an old, leaked code from still working
 * after the user requested a fresh one.
 *
 * In development, if SMTP isn't configured, the plaintext code is
 * returned directly in the result so the flow can still be tested
 * end-to-end without a real mail account. This NEVER happens in
 * production, regardless of SMTP configuration.
 */
const createAndSendOtp = async ({ userId = null, email, purpose }) => {
  await OTPVerification.deleteMany({ email, purpose, isVerified: false });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, env.bcryptSaltRounds);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTPVerification.create({
    user: userId,
    email,
    purpose,
    codeHash,
    expiresAt,
    maxAttempts: MAX_ATTEMPTS,
  });

  const emailResult = await sendOtpEmail(email, code, purpose);

  const devCode = !env.isProduction && !isSmtpConfigured ? code : undefined;

  return { sent: emailResult.sent, devCode };
};

/**
 * Verifies a submitted OTP code against the most recent, unverified,
 * unexpired record for that email + purpose. Increments `attempts` on
 * every wrong guess and locks the code out entirely once `maxAttempts`
 * is reached, even if the correct code is later guessed — a fresh OTP
 * must be requested instead. This is what makes brute-forcing a 6-digit
 * code impractical (5 attempts per code, then it's dead).
 */
const verifyOtp = async ({ email, code, purpose }) => {
  const otpRecord = await OTPVerification.findOne({ email, purpose, isVerified: false })
    .sort('-createdAt')
    .select('+codeHash');

  if (!otpRecord) {
    throw ApiError.badRequest('No pending verification code found. Please request a new one.', 'OTP_NOT_FOUND');
  }

  if (otpRecord.expiresAt < new Date()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.', 'OTP_EXPIRED');
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.', 'OTP_MAX_ATTEMPTS');
  }

  const isMatch = await bcrypt.compare(code, otpRecord.codeHash);

  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw ApiError.badRequest('Incorrect code. Please try again.', 'OTP_INVALID');
  }

  otpRecord.isVerified = true;
  await otpRecord.save();

  return otpRecord;
};

module.exports = { createAndSendOtp, verifyOtp };
