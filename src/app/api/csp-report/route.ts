import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report Endpoint
 * Receives and logs Content Security Policy violations
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_reports
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    // Log CSP violation for monitoring
    console.warn('[CSP Violation]', {
      documentUri: report['csp-report']?.['document-uri'],
      violatedDirective: report['csp-report']?.['violated-directive'],
      blockedUri: report['csp-report']?.['blocked-uri'],
      lineNumber: report['csp-report']?.['line-number'],
      sourceFile: report['csp-report']?.['source-file'],
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to:
    // 1. Store violations in database for analysis
    // 2. Send to external monitoring service (Sentry, LogRocket, etc.)
    // 3. Alert on critical violations

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[CSP Report] Failed to process violation report:', error);
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}

// Allow GET requests for health checks
export async function GET() {
  return NextResponse.json({
    endpoint: 'csp-report',
    status: 'active',
    description: 'CSP violation reporting endpoint'
  });
}
