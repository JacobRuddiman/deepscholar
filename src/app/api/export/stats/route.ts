/**
 * Export Stats API Route
 * 
 * Returns export usage statistics for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  console.log('📊 Stats API called');
  
  try {
    // Get authentication (handle local mode)
    let session;
    if (isLocalMode()) {
      console.log('🏠 Using local mode for stats');
      session = getLocalSession();
    } else {
      console.log('🔐 Using auth session for stats');
      session = await auth();
      if (!session?.user?.id) {
        console.log('❌ No auth session found for stats');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    if (!session?.user?.id) {
      console.log('❌ No user ID in session for stats');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('👤 Getting stats for user:', session.user.id);

    const stats = await exportService.getExportStats(session.user.id);

    console.log('📊 Stats retrieved:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('💥 Export stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
