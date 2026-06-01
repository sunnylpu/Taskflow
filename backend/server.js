/**
 * server.js — Application Entry Point
 *
 * Dual-mode:
 *   - Local dev:  app.listen() on 127.0.0.1 (localhost only, not 0.0.0.0)
 *   - Vercel:     module.exports = app (serverless — no listen needed)
 *
 * Vercel automatically calls the exported Express app as a serverless function.
 */

require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/utils/logger');

// ── Local Development Server ──────────────────────────────────────────────────
// Only start listening when run directly (node server.js / nodemon)
// On Vercel, this block is SKIPPED — Vercel uses `module.exports = app` below.
if (require.main === module) {
  const PORT = parseInt(process.env.PORT, 10) || 3001;
  // SECURITY: Bind to localhost only in dev — never 0.0.0.0
  const HOST = '127.0.0.1';

  const server = app.listen(PORT, HOST, () => {
    logger.info(`🚀 TaskFlow API running on http://${HOST}:${PORT}`);
    logger.info(`📚 Swagger docs: http://${HOST}:${PORT}/api/docs`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ── Graceful Shutdown ───────────────────────────────────────────────────────
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down...');
    server.close(() => process.exit(0));
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message });
  process.exit(1);
});

// ── Vercel Serverless Export ──────────────────────────────────────────────────
// Vercel picks this up and wraps Express as a serverless function.
// Local dev ignores this export.
module.exports = app;
