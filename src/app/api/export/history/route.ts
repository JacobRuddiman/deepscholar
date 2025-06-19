/**
 * Export History API Route
 * 
 * Returns export history for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  try {
    // Get authentication (handle local mode)
    let session;
    if (isLocalMode()) {
      session = getLocalSession();
    } else {
      session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await exportService.getExportHistory(session.user.id, limit);

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Export history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
