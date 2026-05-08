/**
 * Brief Export API Route
 *
 * Handles exporting individual briefs in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/export/services/ExportService';
import { ExportFormat } from '@/lib/export/types';
import { apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;

  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const briefId = resolvedParams.id;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const includeReferences = searchParams.get('includeReferences') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';

    // Validate format
    const validFormats = ['pdf', 'markdown', 'html', 'json', 'docx', 'txt'];
    if (!validFormats.includes(format)) {
      return apiError(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400);
    }

    // Create export request
    const exportRequest = {
      type: 'brief' as const,
      format: format as ExportFormat,
      id: briefId,
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
    console.error('Brief export error:', error);
    return apiError('Internal server error', 500);
  }
}
