/**
 * task.service.js — Task CRUD Business Logic
 *
 * Security rules enforced:
 * - All DB queries use Prisma ORM (parameterized, no string concatenation)
 * - Ownership validation on every read/update/delete (server-side, not client-side)
 * - Admin users can access all tasks (RBAC checked here)
 * - Pagination enforced to prevent DoS via large result sets
 * - SQL errors never exposed to callers (Prisma throws structured errors)
 */

const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * List tasks — users see only their own tasks; admins see all.
 * @param {string} userId
 * @param {string} userRole - 'USER' | 'ADMIN'
 * @param {{ page: number, limit: number, status?: string, priority?: string }} query
 */
async function listTasks(userId, userRole, { page, limit, status, priority }) {
  const skip = (page - 1) * limit;

  // Admins see all tasks; users see only their own
  const whereClause = {
    ...(userRole !== 'ADMIN' && { ownerId: userId }),
    ...(status && { status }),
    ...(priority && { priority }),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.task.count({ where: whereClause }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single task by ID — enforces ownership.
 * @param {string} taskId
 * @param {string} userId
 * @param {string} userRole
 */
async function getTaskById(taskId, userId, userRole) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!task) {
    const err = new Error('Task not found.');
    err.statusCode = 404;
    throw err;
  }

  // CRITICAL: server-side ownership check — never trust client claims
  if (userRole !== 'ADMIN' && task.ownerId !== userId) {
    logger.warn('Unauthorized task access attempt', {
      requestingUserId: userId,
      taskOwnerId: task.ownerId,
      taskId,
    });
    const err = new Error('Task not found.'); // Generic message — hides existence
    err.statusCode = 404;
    throw err;
  }

  return task;
}

/**
 * Create a new task for the authenticated user.
 * @param {string} userId - Owner's user ID (from verified JWT, not request body)
 * @param {{ title: string, description?: string, status?: string, priority?: string }} data
 */
async function createTask(userId, data) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      ownerId: userId, // Always from JWT, never from client body
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('Task created', { taskId: task.id, ownerId: userId });
  return task;
}

/**
 * Update a task — enforces ownership.
 * @param {string} taskId
 * @param {string} userId
 * @param {string} userRole
 * @param {Partial<{ title, description, status, priority }>} updates
 */
async function updateTask(taskId, userId, userRole, updates) {
  // Verify ownership/access before updating
  await getTaskById(taskId, userId, userRole);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updates,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('Task updated', { taskId, updatedBy: userId });
  return task;
}

/**
 * Delete a task — enforces ownership.
 * @param {string} taskId
 * @param {string} userId
 * @param {string} userRole
 */
async function deleteTask(taskId, userId, userRole) {
  // Verify ownership/access before deleting
  await getTaskById(taskId, userId, userRole);

  await prisma.task.delete({ where: { id: taskId } });
  logger.info('Task deleted', { taskId, deletedBy: userId });
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
