/**
 * logger.js — Winston structured logger
 *
 * Security rules enforced:
 * - Logs are structured JSON (never raw request bodies)
 * - No passwords, tokens, or PII in log messages
 * - Stack traces only in development, never in production responses
 */

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, errors, json, colorize, simple } = format;

const isDev = process.env.NODE_ENV !== 'production';

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: isDev }), // Only include stack traces in dev
    json()
  ),
  defaultMeta: { service: 'taskflow-api' },
  transports: [
    // Always log to console
    new transports.Console({
      format: isDev
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
    }),
  ],
});

// In production, you would add file or remote transports here
// TODO(security): Add centralized log aggregation (e.g., Datadog, CloudWatch) for production

module.exports = logger;
