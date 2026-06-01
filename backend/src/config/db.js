/**
 * db.js — Prisma Client singleton
 *
 * Exports a single PrismaClient instance to avoid connection pool exhaustion
 * during hot-reload in development.
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// In development, attach the client to global to prevent exhausting connections
// during hot-reload. In production, this is just a module-level singleton.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  // Log query execution time but NEVER log query parameters (may contain PII)
  prisma.$on('query', (e) => {
    logger.debug(`Prisma query executed in ${e.duration}ms`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
