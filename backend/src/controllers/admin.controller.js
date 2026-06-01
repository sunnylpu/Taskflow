/**
 * admin.controller.js — Admin Route Handlers
 *
 * All routes here require ADMIN role (enforced by RBAC middleware in router).
 */

const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * GET /api/v1/admin/users
 * Lists all registered users. Admin only.
 */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { tasks: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/admin/tasks
 * Lists all tasks across all users. Admin only.
 */
async function listAllTasks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
      prisma.task.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/admin/users/:id
 * Deletes a user and all their tasks (cascade). Admin only.
 * Cannot delete your own account via this endpoint.
 */
async function deleteUser(req, res, next) {
  try {
    const targetId = req.params.id;

    // Prevent admin from deleting themselves
    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account via this endpoint.',
      });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Delete user (cascades to tasks via Prisma schema)
    await prisma.user.delete({ where: { id: targetId } });

    logger.info('Admin deleted user', {
      adminId: req.user.id,
      deletedUserId: targetId,
    });

    return res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/role
 * Changes a user's role. Admin only.
 */
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const allowedRoles = ['USER', 'ADMIN'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(422).json({
        success: false,
        message: 'Role must be USER or ADMIN.',
      });
    }

    const targetId = req.params.id;

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    logger.info('Admin updated user role', {
      adminId: req.user.id,
      targetUserId: targetId,
      newRole: role,
    });

    return res.status(200).json({
      success: true,
      message: 'User role updated.',
      data: { user },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    next(err);
  }
}

module.exports = { listUsers, listAllTasks, deleteUser, updateUserRole };
