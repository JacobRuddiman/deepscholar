/**
 * User Profile Export API Route
 * 
 * Handles exporting user profiles in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const includeReferences = searchParams.get('includeReferences') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    // Validate format
    const validFormats = ['json', 'csv', 'pdf', 'html'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Create export request
    const exportRequest = {
      type: 'user_profile' as const,
      format: format as any,
      id: userId,
      options: {
        includeReferences,
        includeMetadata,
      },
    };

    // Process export
    const result = await exportService.export(exportRequest, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return the file
    const response = new NextResponse(result.data?.content);
    
    // Set appropriate headers
    response.headers.set('Content-Type', result.data?.mimeType || 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    if (result.size) {
      response.headers.set('Content-Length', result.size.toString());
    }

    return response;

  } catch (error) {
    console.error('User profile export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
