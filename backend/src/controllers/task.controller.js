/**
 * task.controller.js — Task Route Handlers
 */

const taskService = require('../services/task.service');
const { listTasksQuerySchema } = require('../schemas/task.schema');

/**
 * GET /api/v1/tasks
 * Lists tasks. Users see their own; admins see all.
 */
async function listTasks(req, res, next) {
  try {
    // Validate query params
    const query = listTasksQuerySchema.parse(req.query);
    const result = await taskService.listTasks(req.user.id, req.user.role, query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks/:id
 * Gets a task by ID. Enforces ownership server-side.
 */
async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: { task },
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
 * POST /api/v1/tasks
 * Creates a new task. Owner is set from JWT (never from request body).
 */
async function createTask(req, res, next) {
  try {
    // req.user.id comes from verified JWT — never from request body
    const task = await taskService.createTask(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/:id
 * Updates a task. Enforces ownership server-side.
 */
async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
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
 * DELETE /api/v1/tasks/:id
 * Deletes a task. Enforces ownership server-side.
 */
async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id, req.user.id, req.user.role);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
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

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
