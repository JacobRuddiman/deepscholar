/**
 * Analytics and performance monitoring utilities
 * Supports Google Analytics, custom analytics, and Core Web Vitals
 */

/** Web Vitals metric type (from web-vitals package) */
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  label: string;
  entries: PerformanceEntry[];
  navigationType: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Google Analytics measurement ID
 * Set via environment variable: NEXT_PUBLIC_GA_ID
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Send event to Google Analytics
 */
export function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

/**
 * Send pageview to Google Analytics
 */
export function sendPageview(url: string) {
  if (!GA_MEASUREMENT_ID) return;

  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

/**
 * Send custom event to Google Analytics
 */
export function sendEvent({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) {
  if (!GA_MEASUREMENT_ID) return;

  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

/**
 * Report Web Vitals to analytics
 * Called automatically by Next.js via reportWebVitals export
 */
export function reportWebVitals(metric: Metric) {
  // Send to Google Analytics
  if (GA_MEASUREMENT_ID && metric.label === 'web-vital') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  sendMetricToAnalytics(metric);
}

/**
 * Send metric to custom analytics endpoint
 */
async function sendMetricToAnalytics(metric: Metric) {
  try {
    // Send to your analytics API
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Use beacon API for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      // Fallback to fetch with keepalive
      fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't impact user experience
      });
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.error('[Analytics] Failed to send metric:', error);
  }
}

/**
 * Track custom user events
 */
export const analytics = {
  /**
   * Track page view
   */
  pageView: (url: string) => {
    sendPageview(url);
  },

  /**
   * Track button/link click
   */
  click: (elementName: string, metadata?: Record<string, any>) => {
    sendEvent({
      action: 'click',
      category: 'engagement',
      label: elementName,
    });

    // Send to custom endpoint
    if (typeof window !== 'undefined') {
      navigator.sendBeacon('/api/analytics/events', JSON.stringify({
        event: 'click',
        element: elementName,
        metadata,
        timestamp: Date.now(),
        url: window.location.href,
      }));
    }
  },

  /**
   * Track form submission
   */
  formSubmit: (formName: string, success: boolean) => {
    sendEvent({
      action: 'form_submit',
      category: 'forms',
      label: formName,
      value: success ? 1 : 0,
    });
  },

  /**
   * Track search
   */
  search: (query: string, resultsCount?: number) => {
    sendEvent({
      action: 'search',
      category: 'engagement',
      label: query,
      value: resultsCount,
    });
  },

  /**
   * Track download/export
   */
  download: (fileName: string, fileType: string) => {
    sendEvent({
      action: 'download',
      category: 'content',
      label: `${fileName} (${fileType})`,
    });
  },

  /**
   * Track share action
   */
  share: (platform: string, contentType: string) => {
    sendEvent({
      action: 'share',
      category: 'social',
      label: `${platform} - ${contentType}`,
    });
  },

  /**
   * Track error
   */
  error: (errorName: string, errorMessage: string, fatal: boolean) => {
    gtag('event', 'exception', {
      description: `${errorName}: ${errorMessage}`,
      fatal,
    });

    // Send to custom endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: errorName,
          message: errorMessage,
          fatal,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  },

  /**
   * Track timing (e.g., API response time)
   */
  timing: (name: string, duration: number, category?: string) => {
    gtag('event', 'timing_complete', {
      name,
      value: duration,
      event_category: category || 'performance',
    });
  },
};

/**
 * Performance observer for monitoring long tasks
 */
export function observeLongTasks() {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log tasks longer than 50ms
        if (entry.duration > 50) {
          console.warn('[Performance] Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });

          // Send to analytics
          analytics.timing('long_task', entry.duration, 'performance_issues');
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    // PerformanceObserver not supported
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
    loadComplete: navigation?.loadEventEnd,

    // Paint timing
    firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
  };
}
