# Bot Detection and Prevention Guide

## Overview

DeepScholar implements a comprehensive bot detection system that uses behavioral analysis, request patterns, and automated checks to identify and block automated access.

## Features

### 1. Multi-Layer Detection

**Request Analysis:**
- User-Agent pattern matching
- Known bot detection (crawlers, scrapers)
- Request rate limiting
- IP-based pattern analysis

**Behavioral Analysis:**
- Mouse/keyboard interaction tracking
- Form submission speed
- Session duration
- Honeypot field detection

### 2. Automated Actions

Based on bot confidence score:
- **Low (30-59)**: Require CAPTCHA
- **Medium (60-79)**: Block action
- **High (80-94)**: Block + log incident
- **Critical (95-100)**: Rate limit IP/user for 1 hour

### 3. Bot Score Calculation

Each detection rule contributes to a cumulative bot score (0-100):

| Rule | Score | Description |
|------|-------|-------------|
| Bot User-Agent | +50 | Matches known bot patterns |
| Missing/Invalid UA | +30 | No or very short user agent |
| Honeypot filled | +80 | Hidden field was filled |
| Fast form submit | +40 | Submitted in <2 seconds |
| Low mouse events | +25 | <5 mouse movements |
| Low keyboard events | +20 | <3 keyboard presses |
| Short session | +30 | <5 seconds on site |
| Rate limit exceeded | +35 | Too many requests |
| Suspicious IP | +25 | Multiple users from same IP |

## Detection Rules

### Bot User Agents

```typescript
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper',
  'curl', 'wget', 'python-requests',
  'go-http-client', 'java/', 'scrapy',
];
```

### Rate Limits

```typescript
const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_REQUESTS_PER_HOUR: 500,
};
```

### Behavioral Thresholds

```typescript
const BEHAVIORAL_THRESHOLDS = {
  MIN_MOUSE_EVENTS: 5,
  MIN_KEYBOARD_EVENTS: 3,
  MIN_SESSION_DURATION: 5, // seconds
  MAX_FORM_SUBMIT_SPEED: 2, // seconds
};
```

## Database Schema

### BotDetectionLog Table

```sql
CREATE TABLE "BotDetectionLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "botScore" INTEGER NOT NULL,
  "reasons" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- 'allow', 'captcha', 'block', 'rate_limit'
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);
```

### RequestLog Table

```sql
CREATE TABLE "RequestLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);
```

### RateLimitEntry Table

```sql
CREATE TABLE "RateLimitEntry" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT UNIQUE NOT NULL, -- Format: "ip:userId"
  "ipAddress" TEXT NOT NULL,
  "userId" TEXT,
  "requestCount" INTEGER DEFAULT 0,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## Implementation

### 1. Server Actions

**File**: `src/server/actions/security/bot-detection.ts`

```typescript
import {
  checkBot,
  checkRateLimit,
  logRequest,
  getBotDetectionLogs,
  getUserBotScore,
} from '@/server/actions/security/bot-detection';
```

#### Check for Bot

```typescript
const result = await checkBot({
  userAgent: req.headers['user-agent'],
  ip: req.headers['x-forwarded-for'],
  honeypotValue: formData.website_url, // Hidden field
  formSubmitTime: formData.submitTime,
  mouseEvents: behaviorData.mouseEvents,
  keyboardEvents: behaviorData.keyboardEvents,
  sessionDuration: behaviorData.sessionDuration,
});

// result contains:
// {
//   isBot: boolean,
//   confidence: number (0-100),
//   reasons: string[],
//   action: 'allow' | 'captcha' | 'block' | 'rate_limit'
// }

if (result.action === 'block' || result.action === 'rate_limit') {
  return { error: 'Access denied' };
}

if (result.action === 'captcha') {
  return { requireCaptcha: true };
}
```

#### Check Rate Limit

```typescript
const isLimited = await checkRateLimit();

if (isLimited) {
  return { error: 'Rate limit exceeded' };
}
```

#### Log Request

```typescript
// Log every request for rate limiting
await logRequest();
```

### 2. React Query Hooks

**File**: `src/hooks/mutations/useBotDetection.ts`

```typescript
import {
  useBotCheck,
  useRateLimitCheck,
  useUserBotScore,
  useBotDetectionLogs,
} from '@/hooks/mutations/useBotDetection';
```

#### Bot Check

```typescript
'use client';

const botCheck = useBotCheck();

const handleSubmit = async (formData) => {
  const behaviorData = getBotDetectionData();

  const result = await botCheck.mutateAsync({
    honeypotValue: formData.website_url,
    formSubmitTime: Date.now() - formLoadTime,
    ...behaviorData,
  });

  if (result.action === 'block' || result.action === 'rate_limit') {
    // Blocked - toast shown automatically
    return;
  }

  if (result.action === 'captcha') {
    // Show CAPTCHA
    setShowCaptcha(true);
    return;
  }

  // Proceed
  await submitForm(formData);
};
```

#### Rate Limit Check

```typescript
const { data: isLimited } = useRateLimitCheck();

if (isLimited) {
  return <RateLimitedMessage />;
}
```

### 3. Client-Side Tracking

**File**: `src/components/security/BotDetectionTracker.tsx`

#### Add to Root Layout

```typescript
// app/layout.tsx
import { BotDetectionTracker } from '@/components/security/BotDetectionTracker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BotDetectionTracker />
        {children}
      </body>
    </html>
  );
}
```

#### Get Tracked Data

```typescript
import { getBotDetectionData } from '@/components/security/BotDetectionTracker';

const behaviorData = getBotDetectionData();
// Returns: { mouseEvents, keyboardEvents, sessionDuration }
```

#### Add Honeypot to Forms

```typescript
import { HoneypotInput } from '@/components/security/BotDetectionTracker';

export function SignupForm() {
  return (
    <form>
      <input name="email" type="email" />
      <input name="password" type="password" />

      {/* Hidden honeypot field */}
      <HoneypotInput name="website_url" />

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Usage Examples

### Example 1: Protected Form Submission

```typescript
// src/server/actions/auth/signup.ts
import { checkBot } from '@/server/actions/security/bot-detection';
import { getBotDetectionData } from '@/components/security/BotDetectionTracker';

export async function signup(formData: FormData) {
  // Get behavior data from client
  const behaviorData = JSON.parse(formData.get('behaviorData') as string);

  // Check for bot
  const botCheck = await checkBot({
    honeypotValue: formData.get('website_url') as string,
    formSubmitTime: parseInt(formData.get('submitTime') as string),
    ...behaviorData,
  });

  if (botCheck.action === 'block' || botCheck.action === 'rate_limit') {
    return { error: 'Access denied' };
  }

  if (botCheck.action === 'captcha') {
    return { requireCaptcha: true };
  }

  // Proceed with signup
  const user = await createUser(formData);
  return { success: true, user };
}
```

### Example 2: Client Form with Bot Detection

```typescript
'use client';

import { useState, useRef } from 'react';
import { getBotDetectionData, HoneypotInput } from '@/components/security/BotDetectionTracker';
import { signup } from '@/server/actions/auth/signup';

export function SignupForm() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const formLoadTime = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add behavior data
    const behaviorData = getBotDetectionData();
    formData.append('behaviorData', JSON.stringify(behaviorData));

    // Add submit time
    formData.append('submitTime', String(Date.now() - formLoadTime.current));

    // Submit
    const result = await signup(formData);

    if (result.requireCaptcha) {
      setShowCaptcha(true);
      return;
    }

    if (result.success) {
      // Redirect to dashboard
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <HoneypotInput name="website_url" />

      {showCaptcha && <Captcha />}

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Example 3: Middleware Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, logRequest } from '@/server/actions/security/bot-detection';

export async function middleware(request: NextRequest) {
  // Log request for rate limiting
  await logRequest();

  // Check if rate limited
  const isLimited = await checkRateLimit();

  if (isLimited) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
```

### Example 4: Admin Bot Detection Dashboard

```typescript
// src/app/admin/security/bots/page.tsx
import { BotDetectionLogsTable } from '@/components/security/BotDetectionLogsTable';

export default function BotDetectionPage() {
  return (
    <div className="container py-8">
      <h1>Bot Detection Logs</h1>
      <BotDetectionLogsTable />
    </div>
  );
}
```

### Example 5: API Route Protection

```typescript
// src/app/api/briefs/route.ts
import { checkBot, logRequest } from '@/server/actions/security/bot-detection';

export async function POST(request: Request) {
  // Log request
  await logRequest();

  // Check for bot
  const botCheck = await checkBot();

  if (botCheck.action === 'block' || botCheck.action === 'rate_limit') {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Process request
  const data = await request.json();
  const brief = await createBrief(data);

  return Response.json(brief);
}
```

## Advanced Features

### 1. CAPTCHA Integration

```typescript
// Add reCAPTCHA or hCaptcha
import { verify } from '@/lib/captcha';

if (botCheck.action === 'captcha') {
  const isValid = await verify(captchaToken);

  if (!isValid) {
    return { error: 'Invalid CAPTCHA' };
  }
}
```

### 2. Device Fingerprinting

```typescript
// Use FingerprintJS or similar
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();

await checkBot({
  ...params,
  deviceFingerprint: result.visitorId,
});
```

### 3. Machine Learning Detection

```typescript
// Train ML model on bot patterns
async function checkBotWithML(features: BotFeatures): Promise<number> {
  const response = await fetch('/api/ml/bot-detection', {
    method: 'POST',
    body: JSON.stringify(features),
  });

  const { botProbability } = await response.json();
  return botProbability * 100;
}
```

## Best Practices

### 1. Balance Detection Sensitivity

- Too strict: Legitimate users blocked (VPN users, fast typists)
- Too lenient: Bots get through
- Monitor false positives and adjust thresholds

### 2. Provide Escape Hatches

Always provide a way for false positives to proceed:
- CAPTCHA for medium-risk users
- Contact support link for blocked users
- Appeal system for rate-limited IPs

### 3. Don't Rely on Client Data Alone

Client-side tracking can be spoofed:
- Use server-side checks as primary defense
- Client data adds confidence but isn't definitive

### 4. Whitelist Legitimate Bots

```typescript
const ALLOWED_BOTS = [
  'googlebot', 'bingbot', 'slackbot',
  'twitterbot', 'facebookexternalhit',
];

if (ALLOWED_BOTS.some(bot => userAgent.toLowerCase().includes(bot))) {
  return { isBot: false, confidence: 0, reasons: [], action: 'allow' };
}
```

### 5. Monitor and Adjust

Regularly review bot detection logs:
- Weekly: Check for false positives
- Monthly: Adjust thresholds
- Quarterly: Update bot patterns

## Performance Considerations

### 1. Caching

Cache bot check results:

```typescript
const cacheKey = `bot:${ip}:${userAgent}`;
const cached = await redis.get(cacheKey);

if (cached) return JSON.parse(cached);

const result = await checkBot(params);
await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min
```

### 2. Async Logging

Don't block requests for logging:

```typescript
// Fire and forget
logRequest().catch(console.error);

// Continue with request
return processRequest(data);
```

### 3. Database Cleanup

Regularly clean old logs:

```sql
-- Delete logs older than 30 days
DELETE FROM "RequestLog" WHERE "createdAt" < datetime('now', '-30 days');
DELETE FROM "BotDetectionLog" WHERE "createdAt" < datetime('now', '-90 days');
```

## Troubleshooting

### Issue: Legitimate users blocked

**Solutions:**
1. Lower bot score thresholds
2. Reduce behavioral requirements
3. Add CAPTCHA instead of blocking
4. Whitelist user levels/reputation

### Issue: Bots getting through

**Solutions:**
1. Add more bot user agent patterns
2. Implement CAPTCHA
3. Add device fingerprinting
4. Lower thresholds for blocking

### Issue: High false positive rate

**Solutions:**
1. Analyze blocked users' patterns
2. Adjust behavioral thresholds
3. Add appeal system
4. Whitelist trusted IPs/users

## Future Enhancements

- [ ] CAPTCHA integration (reCAPTCHA, hCaptcha)
- [ ] Device fingerprinting
- [ ] Machine learning bot classifier
- [ ] Behavior analysis (mouse movement patterns)
- [ ] IP reputation checking
- [ ] Browser automation detection (Selenium, Puppeteer)
- [ ] Headless browser detection
- [ ] WebGL/Canvas fingerprinting
- [ ] Challenge-response system
- [ ] Appeal system for false positives

---

**Last Updated**: December 29, 2025
**Status**: Production Ready
**Dependencies**: Prisma, React Query, Sonner (for toasts)
