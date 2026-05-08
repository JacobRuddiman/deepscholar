/**
 * Export Stats API Route
 *
 * Returns export usage statistics for the current user
 */

import { NextRequest } from 'next/server';
import { exportService } from '@/lib/export/services/ExportService';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const stats = await exportService.getExportStats(session.user.id);

    return apiSuccess(stats);

  } catch (error) {
    console.error('Export stats error:', error);
    return apiError('Internal server error', 500);
  }
}
