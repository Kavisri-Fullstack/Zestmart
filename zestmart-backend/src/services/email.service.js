const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
} else {
  logger.warn(
    'SMTP credentials are missing. Emails will not actually be sent — see .env SMTP_* variables.'
  );
}

/**
 * Sends an email. In development, if SMTP isn't configured, this logs
 * the email instead of throwing — so registration/password-reset flows
 * still work end-to-end locally without requiring a real mail account
 * (the OTP is also returned directly in the API response in that case,
 * see otp.service.js).
 */
const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    logger.info(`[DEV EMAIL - not sent, SMTP not configured] To: ${to} | Subject: ${subject}`);
    return { sent: false };
  }

  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    return { sent: true };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return { sent: false };
  }
};

const sendOtpEmail = async (email, code, purpose) => {
  const purposeLabel =
    purpose === 'signup_verification' ? 'verify your email' : 'reset your password';

  return sendMail({
    to: email,
    subject: `Your ZestMart verification code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>ZestMart</h2>
        <p>Use the code below to ${purposeLabel}:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendMail, sendOtpEmail, isSmtpConfigured };
