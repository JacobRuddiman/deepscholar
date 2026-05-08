import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * API endpoint to track client-side errors
 */

interface ErrorReport {
  name: string;
  message: string;
  fatal: boolean;
  timestamp: number;
  url: string;
  userAgent: string;
  stack?: string;
}

export async function POST(request: NextRequest) {
  try {
    const error: ErrorReport = await request.json();

    // Validate error
    if (!error.name || !error.message) {
      return apiError('Invalid error data', 400);
    }

    // Log all errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Client Error]', {
        name: error.name,
        message: error.message,
        fatal: error.fatal,
        url: error.url,
      });
    }

    // In production, send to error tracking service
    // You can integrate with:
    // - Sentry
    // - Bugsnag
    // - Rollbar
    // - LogRocket
    // - Custom error logging service

    // Example: Forward to Sentry (if SENTRY_DSN is configured)
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }

    return apiSuccess({ received: true });
  } catch (error) {
    console.error('[Analytics API] Error processing error report:', error);
    return apiSuccess({ received: true });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
