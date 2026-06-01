/**
 * validate.js — Zod Request Validation Middleware
 *
 * Factory function that validates req.body against a Zod schema.
 * Returns 422 with structured field errors on validation failure.
 *
 * Example usage:
 *   router.post('/register', validate(registerSchema), authController.register)
 */

const { ZodError } = require('zod');

/**
 * Factory: returns Express middleware that validates req.body using a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Parse and replace req.body with the validated/sanitized data
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed.',
          errors: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      // Unexpected error — pass to global error handler
      next(err);
    }
  };
}

module.exports = { validate };
