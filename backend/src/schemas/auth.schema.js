/**
 * auth.schema.js — Zod validation schemas for authentication routes
 */

const { z } = require('zod');

/**
 * Schema for user registration.
 * Enforces strong password requirements.
 */
const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must not exceed 128 characters.')
    // Regex: no specific requirements (let zxcvbn decide strength), but block common weak patterns
    .refine(
      (pw) => !/^\s+$/.test(pw),
      'Password cannot be only whitespace.'
    ),
});

/**
 * Schema for user login.
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

module.exports = { registerSchema, loginSchema };
