/**
 * rateLimiter.js — Express Rate Limiter configurations
 *
 * Security rules enforced:
 * - Strict limits on auth endpoints to prevent brute-force attacks
 * - General API limit to prevent DoS
 * - Generic error messages (no internal details exposed)
 *
 * TODO(security): In production, use a Redis store (e.g., rate-limit-redis)
 * to share limits across multiple instances/pods.
 */

const rateLimit = require('express-rate-limit');

/**
 * Auth login rate limiter — prevents brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Registration rate limiter — prevents account creation spam.
 * 5 registrations per hour per IP.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again in an hour.',
  },
});

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = { loginLimiter, registerLimiter, generalLimiter };
