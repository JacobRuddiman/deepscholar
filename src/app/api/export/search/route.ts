/**
 * Search Results Export API Route
 * 
 * Handles exporting search results in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { exportService } from '@/lib/export/services/ExportService';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  console.log('🔍 Search export API called');
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const format = searchParams.get('format') || 'json';
    const includeReferences = searchParams.get('includeReferences') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    console.log('🔍 Search Query:', query);
    console.log('📝 Format:', format);
    console.log('🔗 Include References:', includeReferences);
    console.log('📊 Include Metadata:', includeMetadata);

    if (!query) {
      console.log('❌ No query provided');
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['csv', 'json', 'html', 'pdf'];
    if (!validFormats.includes(format)) {
      console.log('❌ Invalid format:', format);
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Create export request
    const exportRequest = {
      type: 'search_results' as const,
      format: format as any,
      id: query, // Use query as the ID for search results
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
    console.error('💥 Search results export error:', error);
    console.error('📚 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
