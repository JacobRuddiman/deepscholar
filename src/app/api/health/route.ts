import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint
 * Returns the health status of the application and its dependencies
 *
 * @route GET /api/health
 * @returns {object} Health status information
 */
export async function GET() {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
    },
    responseTime: 0,
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = 'unhealthy';
    console.error('[Health Check] Database check failed:', error);
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  // Flag if heap usage is above 80%
  const heapUsagePercent = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
  if (heapUsagePercent > 80) {
    health.status = 'degraded';
    health.checks.memory = 'warning';
  } else {
    health.checks.memory = 'healthy';
  }

  health.responseTime = Date.now() - startTime;

  // Return appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
