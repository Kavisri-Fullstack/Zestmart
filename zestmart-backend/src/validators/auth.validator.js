const { z } = require('zod');

/**
 * Validation schemas for the Auth APIs, matching the field rules
 * described in the spec (name 2-60 chars, valid email, strong password,
 * valid phone).
 */

const passwordRule = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be under 72 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneRule = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
  .optional();

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be under 60 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Invalid email address'),
    password: passwordRule,
    phone: phoneRule,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string({ required_error: 'idToken is required' }).min(1, 'idToken is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
    code: z
      .string({ required_error: 'code is required' })
      .trim()
      .regex(/^[0-9]{6}$/, 'code must be a 6-digit number'),
    purpose: z.enum(['signup_verification', 'password_reset'], {
      errorMap: () => ({ message: 'purpose must be "signup_verification" or "password_reset"' }),
    }),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string({ required_error: 'resetToken is required' }).min(1, 'resetToken is required'),
    newPassword: passwordRule,
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
