/**
 * Export Reset API Route
 * 
 * Resets daily export count for local mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function POST(request: NextRequest) {
  try {
    // Only allow in local mode
    if (!isLocalMode()) {
      return NextResponse.json(
        { error: 'Not available in production mode' },
        { status: 403 }
      );
    }

    // Get authentication
    const session = getLocalSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await exportService.resetDailyExports(session.user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Export reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
