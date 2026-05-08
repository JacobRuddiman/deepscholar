import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * API endpoint to track custom user events
 */

interface AnalyticsEvent {
  event: string;
  element?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();

    // Validate event
    if (!event.event || !event.timestamp) {
      return apiError('Invalid event data', 400);
    }

    // In production, store or forward to analytics service
    // You can integrate with:
    // - Mixpanel
    // - Amplitude
    // - Segment
    // - Custom database

    return apiSuccess({ received: true });
  } catch (error) {
    console.error('[Analytics API] Error processing event:', error);
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
