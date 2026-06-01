/**
 * admin.routes.js — Admin API Routes (v1)
 * All routes require ADMIN role.
 */

const router = require('express').Router();
const adminController = require('../../controllers/admin.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

// All admin routes: must be authenticated AND have ADMIN role
router.use(authenticate, requireRole('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations (requires ADMIN role)
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List all registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (ADMIN role required)
 */
router.get('/users', adminController.listUsers);

/**
 * @swagger
 * /api/v1/admin/tasks:
 *   get:
 *     summary: List all tasks across all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of all tasks with owner info
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (ADMIN role required)
 */
router.get('/tasks', adminController.listAllTasks);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete a user and all their data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     summary: Update a user's role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Invalid role value
 */
router.patch('/users/:id/role', adminController.updateUserRole);

module.exports = router;
