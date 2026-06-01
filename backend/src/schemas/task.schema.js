/**
 * task.schema.js — Zod validation schemas for task routes
 */

const { z } = require('zod');

const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
  errorMap: () => ({ message: 'Status must be TODO, IN_PROGRESS, or DONE.' }),
});

const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH'], {
  errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH.' }),
});

/**
 * Schema for creating a new task.
 */
const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(200, 'Title must not exceed 200 characters.'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters.')
    .optional(),

  status: TaskStatus.optional().default('TODO'),

  priority: Priority.optional().default('MEDIUM'),
});

/**
 * Schema for updating an existing task.
 * All fields optional — supports partial updates.
 */
const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(200, 'Title must not exceed 200 characters.')
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters.')
    .nullable()
    .optional(),

  status: TaskStatus.optional(),

  priority: Priority.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update.'
);

/**
 * Schema for query parameters on list tasks endpoint.
 */
const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: TaskStatus.optional(),
  priority: Priority.optional(),
});

module.exports = { createTaskSchema, updateTaskSchema, listTasksQuerySchema };
