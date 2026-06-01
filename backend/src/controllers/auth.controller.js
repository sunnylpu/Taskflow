/**
 * auth.controller.js — Authentication Route Handlers
 */

const authService = require('../services/auth.service');
const prisma = require('../config/db');

/**
 * POST /api/v1/auth/register
 * Registers a new user account.
 */
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.register(email, password);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    // Pass to global error handler
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticates user and returns JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: { user, token },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile.
 */
async function getMe(req, res, next) {
  try {
    // req.user is populated by authenticate middleware (verified JWT)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Client-side logout — instructs client to discard token.
 * Note: JWT is stateless. For production, implement token blacklisting
 * or short-lived tokens + refresh token rotation.
 *
 * TODO(security): Implement server-side token invalidation using Redis
 * or a token blacklist for true server-side logout.
 */
async function logout(req, res) {
  // With stateless JWTs, server cannot truly "invalidate" a token
  // This endpoint exists to provide a clean client-side logout flow
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your token.',
  });
}

module.exports = { register, login, getMe, logout };
