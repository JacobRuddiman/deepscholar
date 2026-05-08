/**
 * Search Results Export API Route
 *
 * Handles exporting search results in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/export/services/ExportService';
import { ExportFormat } from '@/lib/export/types';
import { apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const format = searchParams.get('format') || 'json';
    const includeReferences = searchParams.get('includeReferences') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    if (!query) {
      return apiError('Query parameter is required', 400);
    }

    // Validate format
    const validFormats = ['csv', 'json', 'html', 'pdf'];
    if (!validFormats.includes(format)) {
      return apiError(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400);
    }

    // Create export request
    const exportRequest = {
      type: 'search_results' as const,
      format: format as ExportFormat,
      id: query, // Use query as the ID for search results
      options: {
        includeReferences,
        includeMetadata,
      },
    };

    // Process export
    const result = await exportService.export(exportRequest, session.user.id);

    if (!result.success) {
      return apiError(result.error || 'Export failed', 400);
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
    console.error('Search results export error:', error);
    return apiError('Internal server error', 500);
  }
}
