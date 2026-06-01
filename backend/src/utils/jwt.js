/**
 * jwt.js — Secure JWT secret resolution
 *
 * Resolution order (3-tier, no hardcoded fallback):
 *   1. process.env.JWT_SECRET
 *   2. ./jwt_secret.txt (local dev file)
 *   3. crypto.randomBytes(32) + severe warning (ephemeral, instance-isolated)
 *
 * TODO(security): In production, use a KMS / secret manager (e.g., AWS Secrets
 * Manager, GCP Secret Manager) instead of environment variables.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let _cachedSecret = null;

/**
 * Returns the JWT signing secret using a secure multi-tier fallback.
 * @returns {string} The JWT secret
 */
function getSecret() {
  if (_cachedSecret) return _cachedSecret;

  // Tier 1: Environment variable (preferred for production)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 32) {
    _cachedSecret = process.env.JWT_SECRET.trim();
    return _cachedSecret;
  }

  // Tier 2: Local secret file (useful for dev without env vars)
  const secretFilePath = path.join(__dirname, '../../jwt_secret.txt');
  if (fs.existsSync(secretFilePath)) {
    const fileSecret = fs.readFileSync(secretFilePath, 'utf-8').trim();
    if (fileSecret.length >= 32) {
      _cachedSecret = fileSecret;
      logger.warn('JWT secret loaded from jwt_secret.txt — ensure this file is in .gitignore');
      return _cachedSecret;
    }
  }

  // Tier 3: Ephemeral random secret — works for single-instance dev only
  _cachedSecret = crypto.randomBytes(64).toString('hex');
  logger.warn(
    '⚠️  JWT_SECRET not set. Generated ephemeral secret. ' +
    'This is INSTANCE-ISOLATED — all tokens will be invalidated on restart. ' +
    'Set JWT_SECRET in .env for persistent authentication.'
  );
  return _cachedSecret;
}

module.exports = { getSecret };
