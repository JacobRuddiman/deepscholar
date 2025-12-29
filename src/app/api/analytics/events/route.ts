import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', event);
    }

    // In production, store or forward to analytics service
    // You can integrate with:
    // - Mixpanel
    // - Amplitude
    // - Segment
    // - Custom database

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error processing event:', error);
    return NextResponse.json({ success: true }, { status: 200 });
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
