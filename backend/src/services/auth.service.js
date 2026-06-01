/**
 * auth.service.js — Authentication Business Logic
 *
 * Security rules enforced:
 * - Passwords hashed with bcrypt (salt rounds = 12)
 * - zxcvbn score < 2 rejected (prevents weak passwords)
 * - Passwords NEVER logged (even on failure)
 * - Same generic error message for invalid email/password (prevents user enumeration)
 * - JWT signed with hardcoded HS256 algorithm
 * - exp claim always set
 *
 * TODO(security): Add MFA (TOTP) support
 * TODO(security): Add OAuth provider support (Google, GitHub)
 * TODO(security): Integrate have-i-been-pwned API for leaked password detection
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zxcvbn = require('zxcvbn');
const prisma = require('../config/db');
const { getSecret } = require('../utils/jwt');
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = 12;
const ZXCVBN_MIN_SCORE = 2; // 0-4 scale; 2 = "fair"

/**
 * Registers a new user.
 * @param {string} email - User's email
 * @param {string} password - User's plain-text password (never stored)
 * @returns {{ user: object, token: string }}
 */
async function register(email, password) {
  // Check password strength (never log password itself)
  const strength = zxcvbn(password);
  if (strength.score < ZXCVBN_MIN_SCORE) {
    const feedback = strength.feedback.suggestions.join(' ') ||
      'Please choose a stronger password.';
    const err = new Error(feedback);
    err.statusCode = 400;
    err.code = 'WEAK_PASSWORD';
    throw err;
  }

  // Check if email already exists (Prisma will throw P2002 on duplicate, but
  // checking here allows us to return a more specific 409)
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Hash password — NEVER store plain-text
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user — Prisma uses parameterized queries, no SQL injection risk
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER', // Force USER role — never trust client-provided role
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  logger.info('User registered', { userId: user.id });

  const token = signToken(user);
  return { user, token };
}

/**
 * Authenticates a user and returns a JWT.
 * Uses timing-safe comparison to prevent user enumeration.
 * @param {string} email
 * @param {string} password - Plain-text password
 * @returns {{ user: object, token: string }}
 */
async function login(email, password) {
  const GENERIC_AUTH_ERROR = 'Invalid email or password.';

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    // Still run bcrypt to prevent timing-based user enumeration
    await bcrypt.compare(password, '$2b$12$invalidhashtopreventtimingattack!');
    logger.warn('Login attempt for non-existent email', { email: '[redacted]' });
    const err = new Error(GENERIC_AUTH_ERROR);
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    // NEVER log the provided password
    logger.warn('Failed login attempt', { userId: user.id });
    const err = new Error(GENERIC_AUTH_ERROR);
    err.statusCode = 401;
    throw err;
  }

  logger.info('User logged in', { userId: user.id });

  const { passwordHash: _, ...safeUser } = user;
  const token = signToken(safeUser);
  return { user: safeUser, token };
}

/**
 * Signs a JWT for the given user.
 * Algorithm hardcoded to HS256. exp claim always set.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} Signed JWT
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,           // Subject: user ID
      email: user.email,
      role: user.role,
    },
    getSecret(),
    {
      algorithm: 'HS256',     // Hardcoded — never derived from input
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

module.exports = { register, login };
