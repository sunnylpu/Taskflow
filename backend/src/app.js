/**
 * app.js — Express Application Setup
 *
 * Security headers and middleware applied:
 * - Helmet: sets X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.
 * - CORS: strict origin allowlist (no wildcards)
 * - Rate limiter: general limit on all routes
 * - JSON body size limit: prevents large payload DoS
 * - API versioning: all routes under /api/v1/
 * - Swagger UI: developer docs at /api/docs
 * - Global error handler: last middleware
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/v1/auth.routes');
const taskRoutes = require('./routes/v1/task.routes');
const adminRoutes = require('./routes/v1/admin.routes');

const app = express();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // swagger-ui needs inline styles
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    // Clickjacking protection
    frameguard: { action: 'deny' },
    // Prevent MIME type sniffing
    noSniff: true,
    // Disable browser features not needed
    permittedCrossDomainPolicies: false,
  })
);

// Disable x-powered-by header (don't reveal Express)
app.disable('x-powered-by');

// ── CORS — Strict Origin Allowlist ────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body Parsing (size limits to prevent DoS) ─────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── General Rate Limiter (all routes) ────────────────────────────────────────
app.use(generalLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow API is running.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Swagger API Documentation ─────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TaskFlow API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1e1e2e; }',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// ── API Routes (v1) ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
