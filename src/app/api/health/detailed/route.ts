import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-response';

/**
 * Detailed health check endpoint
 * Returns comprehensive health information including database stats
 *
 * @route GET /api/health/detailed
 * @returns {object} Detailed health status information
 */
export async function GET() {
  const startTime = Date.now();

  interface MemoryMetric {
    bytes: number;
    mb: number;
  }

  interface HealthCheckResult {
    status: 'healthy' | 'degraded';
    timestamp: string;
    uptime: number;
    environment: string | undefined;
    nodeVersion: string;
    platform: string;
    arch: string;
    checks: Record<string, unknown>;
    metrics: {
      memory?: { rss: MemoryMetric; heapTotal: MemoryMetric; heapUsed: MemoryMetric; external: MemoryMetric; arrayBuffers: MemoryMetric };
      cpu?: { user: number; system: number };
      [key: string]: unknown;
    };
    responseTime: number;
  }

  const health: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    checks: {},
    metrics: {},
    responseTime: 0,
  };

  // Database health check
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    // Get database stats
    const [briefCount, userCount, categoryCount] = await Promise.all([
      prisma.brief.count(),
      prisma.user.count(),
      prisma.category.count(),
    ]);

    health.checks.database = {
      status: 'healthy',
      responseTime: dbResponseTime,
      stats: {
        briefs: briefCount,
        users: userCount,
        categories: categoryCount,
      },
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error('[Health Check] Database check failed:', String(error));
  }

  // Memory metrics
  const memoryUsage = process.memoryUsage();
  health.metrics.memory = {
    rss: {
      bytes: memoryUsage.rss,
      mb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    heapTotal: {
      bytes: memoryUsage.heapTotal,
      mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    heapUsed: {
      bytes: memoryUsage.heapUsed,
      mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    external: {
      bytes: memoryUsage.external,
      mb: Math.round(memoryUsage.external / 1024 / 1024),
    },
    arrayBuffers: {
      bytes: memoryUsage.arrayBuffers,
      mb: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
    },
  };

  // CPU metrics
  const cpuUsage = process.cpuUsage();
  health.metrics.cpu = {
    user: cpuUsage.user,
    system: cpuUsage.system,
  };

  // Check if memory is concerning
  const heapUsagePercent =
    (health.metrics.memory.heapUsed.mb / health.metrics.memory.heapTotal.mb) * 100;

  health.checks.memory = {
    status: heapUsagePercent > 80 ? 'warning' : 'healthy',
    heapUsagePercent: Math.round(heapUsagePercent * 100) / 100,
  };

  if (heapUsagePercent > 80) {
    health.status = 'degraded';
  }

  health.responseTime = Date.now() - startTime;

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return apiSuccess(health, statusCode);
}
