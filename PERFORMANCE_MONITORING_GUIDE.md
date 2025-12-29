# Performance Monitoring Guide

## Overview

DeepScholar includes comprehensive performance monitoring for Core Web Vitals, custom events, errors, and network timing.

## Core Web Vitals Tracked

### 1. LCP (Largest Contentful Paint)
- **Target**: < 2.5 seconds
- **Good**: < 2.5s
- **Needs Improvement**: 2.5s - 4.0s
- **Poor**: > 4.0s
- **What it measures**: Time until the largest content element is rendered

### 2. FID (First Input Delay)
- **Target**: < 100 milliseconds
- **Good**: < 100ms
- **Needs Improvement**: 100ms - 300ms
- **Poor**: > 300ms
- **What it measures**: Time from first user interaction to browser response

### 3. CLS (Cumulative Layout Shift)
- **Target**: < 0.1
- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25
- **What it measures**: Visual stability - sum of all unexpected layout shifts

### 4. FCP (First Contentful Paint)
- **Target**: < 1.8 seconds
- **What it measures**: Time until first text or image is rendered

### 5. TTFB (Time to First Byte)
- **Target**: < 600 milliseconds
- **What it measures**: Time from navigation to first byte of response

### 6. INP (Interaction to Next Paint)
- **Target**: < 200 milliseconds
- **What it measures**: Responsiveness to user interactions

## Implementation

### 1. Install Dependencies

```bash
npm install web-vitals
```

### 2. Setup in Root Layout

**File**: `app/layout.tsx`

```typescript
import { PerformanceMonitor } from '@/components/analytics/PerformanceMonitor';
import { reportWebVitals } from '@/lib/analytics';

// Export reportWebVitals - Next.js will call it automatically
export { reportWebVitals };

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PerformanceMonitor />
        {children}
      </body>
    </html>
  );
}
```

### 3. Google Analytics Setup (Optional)

**Add to `app/layout.tsx`**:

```tsx
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Set environment variable**:

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 4. Track Page Views

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics';

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    analytics.pageView(pathname);
  }, [pathname]);

  return null;
}
```

## Usage

### Track Custom Events

#### Button Click

```typescript
import { analytics } from '@/lib/analytics';

<button
  onClick={() => {
    analytics.click('export_button', {
      format: 'pdf',
      briefId: brief.id,
    });
    handleExport();
  }}
>
  Export PDF
</button>
```

#### Form Submission

```typescript
const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    analytics.formSubmit('contact_form', true);
  } catch (error) {
    analytics.formSubmit('contact_form', false);
  }
};
```

#### Search

```typescript
const handleSearch = async (query) => {
  const results = await searchBriefs(query);
  analytics.search(query, results.length);
};
```

#### Download/Export

```typescript
const handleExport = (brief) => {
  analytics.download(brief.slug, 'markdown');
  // ... export logic
};
```

#### Share

```typescript
const handleShare = (platform) => {
  analytics.share(platform, 'brief');
  // ... share logic
};
```

#### Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  analytics.error(
    error.name,
    error.message,
    true // fatal error
  );
}
```

#### Timing

```typescript
const startTime = performance.now();
const result = await apiCall();
const duration = performance.now() - startTime;

analytics.timing('api_fetch_briefs', duration, 'api');
```

### Error Boundary Integration

```typescript
'use client';

import { useErrorTracking } from '@/components/analytics/PerformanceMonitor';

export function ErrorBoundaryWrapper({ children }) {
  useErrorTracking(); // Automatically tracks all errors

  return <>{children}</>;
}
```

## API Endpoints

### POST /api/analytics/vitals

Receives Core Web Vitals metrics.

**Request Body**:
```json
{
  "name": "LCP",
  "value": 1234.5,
  "rating": "good",
  "delta": 100,
  "id": "v3-1234567890",
  "navigationType": "navigate",
  "timestamp": 1640000000000,
  "url": "https://example.com/page",
  "userAgent": "Mozilla/5.0..."
}
```

### POST /api/analytics/events

Receives custom event tracking.

**Request Body**:
```json
{
  "event": "click",
  "element": "export_button",
  "metadata": {
    "format": "pdf",
    "briefId": "123"
  },
  "timestamp": 1640000000000,
  "url": "https://example.com/page"
}
```

### POST /api/analytics/errors

Receives client-side error reports.

**Request Body**:
```json
{
  "name": "TypeError",
  "message": "Cannot read property 'foo' of undefined",
  "fatal": true,
  "timestamp": 1640000000000,
  "url": "https://example.com/page",
  "userAgent": "Mozilla/5.0...",
  "stack": "Error stack trace..."
}
```

## Integration with External Services

### Google Analytics

Already integrated via `gtag` in `src/lib/analytics.ts`.

**Automatic tracking**:
- Page views
- Core Web Vitals
- Custom events
- Errors
- Timing events

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Update analytics.ts**:
```typescript
import * as Sentry from '@sentry/nextjs';

export const analytics = {
  error: (name, message, fatal) => {
    Sentry.captureException(new Error(message), {
      tags: { errorName: name },
      level: fatal ? 'error' : 'warning',
    });
  },
};
```

### Datadog (RUM)

```bash
npm install @datadog/browser-rum
```

**Add to layout**:
```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DD_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'deepscholar',
  env: process.env.NODE_ENV,
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
});
```

### Vercel Analytics

```bash
npm install @vercel/analytics
```

**Add to layout**:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Monitoring Dashboard

### View Metrics in Google Analytics

1. Navigate to **Reports** > **Engagement** > **Events**
2. Look for events with category "Web Vitals"
3. Create custom reports for:
   - Average LCP by page
   - FID distribution
   - CLS trends over time

### Custom Dashboard (Future)

Create an admin dashboard to view metrics:

```typescript
// app/admin/analytics/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export default function AnalyticsDashboard() {
  const { data } = useQuery({
    queryKey: ['webVitals'],
    queryFn: async () => {
      // Fetch from your database
      const response = await fetch('/api/admin/analytics/vitals');
      return response.json();
    },
  });

  return (
    <div>
      <h1>Performance Metrics</h1>
      <MetricCard title="LCP" value={data?.avgLCP} target={2500} />
      <MetricCard title="FID" value={data?.avgFID} target={100} />
      <MetricCard title="CLS" value={data?.avgCLS} target={0.1} />
    </div>
  );
}
```

## Performance Optimization Tips

### Improve LCP

1. **Optimize images**:
   ```tsx
   import Image from 'next/image';

   <Image
     src="/hero.jpg"
     alt="Hero"
     priority // Preload above-fold images
     width={1200}
     height={600}
   />
   ```

2. **Preload critical resources**:
   ```tsx
   <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
   ```

3. **Use `priority` for critical images**:
   ```tsx
   <Image src="/logo.png" priority />
   ```

### Improve FID

1. **Code splitting** (already implemented):
   ```typescript
   const HeavyComponent = dynamic(() => import('./Heavy'));
   ```

2. **Reduce JavaScript bundle**:
   - Remove unused dependencies
   - Use tree-shaking
   - Implement code splitting

3. **Defer non-critical JavaScript**:
   ```tsx
   <Script src="/analytics.js" strategy="lazyOnload" />
   ```

### Improve CLS

1. **Reserve space for images**:
   ```tsx
   <Image
     src="/image.jpg"
     width={800}
     height={600} // Prevents layout shift
   />
   ```

2. **Use CSS aspect ratio**:
   ```css
   .video-container {
     aspect-ratio: 16 / 9;
   }
   ```

3. **Avoid inserting content above existing content**:
   - Don't inject ads without reserved space
   - Preload fonts to avoid FOIT/FOUT

### Improve TTFB

1. **Use CDN** (automatic with Vercel)
2. **Enable caching**:
   ```typescript
   export const revalidate = 3600; // Cache for 1 hour
   ```

3. **Optimize API responses**:
   - Use database indexes
   - Implement query caching
   - Minimize data fetching

## Testing Performance

### Lighthouse

```bash
npm install -g lighthouse

# Run Lighthouse
lighthouse https://yoursite.com --view

# CI integration
lighthouse https://yoursite.com --output json --output-path ./report.json
```

### WebPageTest

Visit [webpagetest.org](https://www.webpagetest.org/) and run tests from multiple locations.

### Chrome DevTools

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record**
4. Perform actions
5. Click **Stop**
6. Analyze flame graph for bottlenecks

### Real User Monitoring

Enable in production to collect real user data:
- More accurate than lab testing
- Shows actual user experience
- Identifies issues in specific browsers/devices

## Performance Budget

Set performance budgets in `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true next build"
  },
  "performance": {
    "budgets": [
      {
        "path": "/_app",
        "limit": "200kb"
      },
      {
        "path": "/page/*",
        "limit": "50kb"
      }
    ]
  }
}
```

## Alerts and Monitoring

### Set up alerts for poor metrics

**Example with Google Analytics**:
1. Go to **Admin** > **Custom Alerts**
2. Create alert for "LCP > 4000ms"
3. Set notification email

**Example with Datadog**:
```javascript
// Alert when LCP > 2.5s for 5% of users
{
  "query": "avg(last_5m):avg:browser.performance.lcp{*} > 2500",
  "message": "LCP is degrading!",
  "name": "High LCP Alert"
}
```

## Best Practices

1. **Monitor in production**: Lab metrics don't show real user experience
2. **Track percentiles**: Use p75 (75th percentile) for realistic view
3. **Segment by device/network**: Mobile often has worse metrics
4. **Set realistic targets**: Use field data, not just lab data
5. **Monitor trends**: Look for regressions over time
6. **Fix issues incrementally**: Prioritize high-impact optimizations

## Summary

DeepScholar's performance monitoring system:

**Achievements**:
- ✅ Core Web Vitals tracking
- ✅ Custom event tracking
- ✅ Error tracking
- ✅ Network timing
- ✅ Google Analytics integration
- ✅ API endpoints for data collection
- ✅ Development logging
- ✅ Long task detection

**Ready for**:
- External service integration (Sentry, Datadog, etc.)
- Custom analytics dashboard
- Performance alerts
- Real User Monitoring (RUM)

**Next Steps**:
- Add database storage for metrics
- Create admin analytics dashboard
- Set up performance alerts
- Integrate with error tracking service
- Monitor production metrics

---

**Last Updated**: December 29, 2025
**Status**: Production Ready
**Dependencies**: web-vitals (to be installed)
**Google Analytics**: Optional (via NEXT_PUBLIC_GA_ID)
