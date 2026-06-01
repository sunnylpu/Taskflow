/**
 * rbac.js — Role-Based Access Control Middleware
 *
 * Provides a factory function that generates middleware to restrict routes
 * to specific roles. Must be used AFTER the authenticate middleware.
 *
 * Example usage:
 *   router.get('/admin/users', authenticate, requireRole('ADMIN'), handler)
 */

const logger = require('../utils/logger');

/**
 * Factory: returns Express middleware that enforces role-based access.
 * @param {...string} allowedRoles - One or more roles permitted to access the route
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // authenticate middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RBAC access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
    }

    next();
  };
}

module.exports = { requireRole };
