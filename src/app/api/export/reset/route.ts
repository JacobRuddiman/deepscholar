/**
 * Export Reset API Route
 *
 * Resets daily export count for local mode
 */

import { NextRequest } from 'next/server';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Only allow in local mode
    if (!isLocalMode()) {
      return apiError('Not available in production mode', 403);
    }

    // Get authentication
    const session = getLocalSession();
    if (!session?.user?.id) {
      return apiError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    await exportService.resetDailyExports(session.user.id);

    return apiSuccess({ reset: true });

  } catch (error) {
    console.error('Export reset error:', error);
    return apiError('Internal server error', 500);
  }
}
