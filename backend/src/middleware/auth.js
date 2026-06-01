/**
 * auth.js — JWT Authentication Middleware
 *
 * Security rules enforced:
 * - Algorithm hardcoded to 'HS256' — never derived from token header
 * - 'none' algorithm explicitly rejected
 * - exp claim validated by jsonwebtoken automatically
 * - Attaches verified req.user (id, email, role)
 */

const jwt = require('jsonwebtoken');
const { getSecret } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT Bearer token.
 * Attaches { id, email, role } to req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide a valid Bearer token.',
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    // CRITICAL: algorithm hardcoded — never derived from token header
    // This prevents algorithm confusion attacks (e.g., RS256 → HS256 swap)
    const payload = jwt.verify(token, getSecret(), {
      algorithms: ['HS256'], // Explicit allow-list — rejects 'none'
    });

    // Attach minimal user info (never attach full DB record here)
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    // Log failure without revealing token content
    logger.warn('JWT verification failed', {
      reason: err.message,
      path: req.path,
      ip: req.ip,
    });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
}

module.exports = { authenticate };
