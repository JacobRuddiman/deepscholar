// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client with connection pooling configured
 *
 * Connection pool configuration:
 * - connection_limit: Maximum number of connections in the pool (default: num_cpus * 2 + 1)
 * - pool_timeout: Maximum time to wait for a connection from the pool (default: 10s)
 *
 * For production, ensure your DATABASE_URL includes connection pooling parameters:
 * postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=10
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed when the application shuts down
 */
const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('beforeExit', shutdown);