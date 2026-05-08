/**
 * Export History API Route
 *
 * Returns export history for the current user
 */

import { NextRequest } from 'next/server';
import { exportService } from '@/lib/export/services/ExportService';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await exportService.getExportHistory(session.user.id, limit);

    return apiSuccess({ history });

  } catch (error) {
    console.error('Export history error:', error);
    return apiError('Internal server error', 500);
  }
}
