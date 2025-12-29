'use client';

import { useEffect } from 'react';
import { observeLongTasks, analytics } from '@/lib/analytics';

/**
 * Performance monitoring component
 * Add to root layout to track performance metrics
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Observe long tasks that block the main thread
    observeLongTasks();

    // Track navigation timing when page loads
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        // DNS lookup time
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
        if (dnsTime > 0) {
          analytics.timing('dns_lookup', dnsTime, 'network');
        }

        // TCP connection time
        const tcpTime = navigation.connectEnd - navigation.connectStart;
        if (tcpTime > 0) {
          analytics.timing('tcp_connection', tcpTime, 'network');
        }

        // Time to First Byte
        const ttfb = navigation.responseStart - navigation.requestStart;
        if (ttfb > 0) {
          analytics.timing('ttfb', ttfb, 'network');
        }

        // Download time
        const downloadTime = navigation.responseEnd - navigation.responseStart;
        if (downloadTime > 0) {
          analytics.timing('download', downloadTime, 'network');
        }

        // DOM Interactive
        if (navigation.domInteractive > 0) {
          analytics.timing('dom_interactive', navigation.domInteractive, 'loading');
        }

        // DOM Complete
        if (navigation.domComplete > 0) {
          analytics.timing('dom_complete', navigation.domComplete, 'loading');
        }

        // Load Event
        if (navigation.loadEventEnd > 0) {
          analytics.timing('load_event', navigation.loadEventEnd, 'loading');
        }
      }
    }

    // Track memory usage (if available)
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        analytics.timing('js_heap_size', memory.usedJSHeapSize / 1048576, 'memory'); // MB
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to track page views
 * Use in page components or layouts
 */
export function usePageView(pathname: string) {
  useEffect(() => {
    analytics.pageView(pathname);
  }, [pathname]);
}

/**
 * Hook to track errors
 * Use in error boundaries
 */
export function useErrorTracking() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.error(
        event.error?.name || 'Error',
        event.error?.message || event.message,
        true
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.error(
        'UnhandledPromiseRejection',
        event.reason?.message || String(event.reason),
        true
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}
