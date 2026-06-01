/**
 * errorHandler.js — Global Express Error Handler
 *
 * Security rules enforced:
 * - Generic error messages sent to client (no internal details / stack traces)
 * - Full error details logged server-side via Winston only
 * - Handles Prisma errors with user-friendly messages
 * - Handles Zod errors (backup if validate middleware is bypassed)
 */

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the full error server-side (never expose to client)
  logger.error('Unhandled error', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    // Do NOT log req.body — may contain passwords or tokens
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // ── Prisma Known Errors ─────────────────────────────────────────────────────
  if (err.code === 'P2002') {
    // Unique constraint violation (e.g., duplicate email)
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  if (err.code === 'P2025') {
    // Record not found
    return res.status(404).json({
      success: false,
      message: 'The requested resource was not found.',
    });
  }

  // ── Zod Validation Errors (backup) ─────────────────────────────────────────
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ── JWT Errors ──────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  // ── Default: 500 Internal Server Error ─────────────────────────────────────
  // CRITICAL: Never expose err.message or stack to client in production
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : err.message, // Only expose in dev for easier debugging
  });
}

module.exports = { errorHandler };
