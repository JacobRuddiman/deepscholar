import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  let dbStatus: 'ok' | 'down' = 'down';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'ok';
  } catch (error) {
    console.error('[Health Check] Database check failed:', String(error));
  }

  const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded';
  const statusCode = overallStatus === 'ok' ? 200 : 503;

  return apiSuccess(
    {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      },
    },
    statusCode
  );
}
