import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to receive Core Web Vitals metrics
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - target: < 2.5s
 * - FID (First Input Delay) - target: < 100ms
 * - CLS (Cumulative Layout Shift) - target: < 0.1
 * - FCP (First Contentful Paint) - target: < 1.8s
 * - TTFB (Time to First Byte) - target: < 600ms
 * - INP (Interaction to Next Paint) - target: < 200ms
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Validate metric
    if (!metric.name || metric.value === undefined) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      });
    }

    // In production, store metrics in database
    if (process.env.NODE_ENV === 'production') {
      // Note: This requires a WebVital table in your schema
      // Uncomment after adding schema:
      /*
      await prisma.webVital.create({
        data: {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          metricId: metric.id,
          navigationType: metric.navigationType,
          url: metric.url,
          userAgent: metric.userAgent,
          timestamp: new Date(metric.timestamp),
        },
      });
      */
    }

    // You can also send to external services:
    // - Google Analytics (handled client-side)
    // - Datadog
    // - New Relic
    // - Custom analytics service

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error processing web vital:', error);

    // Don't return error to client - analytics should never break the app
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
