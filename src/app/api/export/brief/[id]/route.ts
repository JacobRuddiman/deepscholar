/**
 * Brief Export API Route
 * 
 * Handles exporting individual briefs in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  console.log('🔍 Brief export API called');
  console.log('📋 Params:', resolvedParams);
  console.log('🔗 URL:', request.url);
  
  try {
    // Get authentication (handle local mode)
    let session;
    if (isLocalMode()) {
      console.log('🏠 Using local mode');
      session = getLocalSession();
    } else {
      console.log('🔐 Using auth session');
      session = await auth();
      if (!session?.user?.id) {
        console.log('❌ No auth session found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    if (!session?.user?.id) {
      console.log('❌ No user ID in session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('👤 User ID:', session.user.id);

    const briefId = resolvedParams.id;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const includeReferences = searchParams.get('includeReferences') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    console.log('📄 Brief ID:', briefId);
    console.log('📝 Format:', format);
    console.log('🔗 Include References:', includeReferences);
    console.log('📊 Include Metadata:', includeMetadata);

    // Validate format
    const validFormats = ['pdf', 'markdown', 'html', 'json', 'docx', 'txt'];
    if (!validFormats.includes(format)) {
      console.log('❌ Invalid format:', format);
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Create export request
    const exportRequest = {
      type: 'brief' as const,
      format: format as any,
      id: briefId,
      options: {
        includeReferences,
        includeMetadata,
      },
    };

    console.log('📦 Export request:', exportRequest);

    // Process export
    console.log('🚀 Calling exportService.export...');
    const result = await exportService.export(exportRequest, session.user.id);

    console.log('📊 Export result:', {
      success: result.success,
      error: result.error,
      filename: result.filename,
      size: result.size
    });

    if (!result.success) {
      console.log('❌ Export failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Export successful, returning file');

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
    console.error('💥 Brief export error:', error);
    console.error('📚 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
