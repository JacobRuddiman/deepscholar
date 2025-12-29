# Spam Detection System Guide

## Overview

DeepScholar includes a comprehensive spam detection system that automatically identifies and handles suspicious content using multiple detection algorithms and behavioral analysis.

## Features

### 1. Multi-Layer Detection

**Content Analysis:**
- Minimum content length requirements
- Excessive link detection
- Repeated character patterns
- Excessive capitalization
- Spam keyword matching

**Behavioral Analysis:**
- Rate limiting (posts per hour)
- Duplicate content detection
- Posting frequency monitoring
- Historical spam score tracking

### 2. Automated Actions

Based on spam confidence score:
- **Low (30-59)**: Flag for manual review
- **Medium (60-79)**: Auto-hide pending review
- **High (80-94)**: Auto-ban user
- **Critical (95-100)**: Instant ban + admin notification

### 3. Spam Score Calculation

Each detection rule contributes to a cumulative spam score (0-100):

| Rule | Score | Description |
|------|-------|-------------|
| Content too short | +15 | Less than 50 characters |
| Too many links | +25 | More than 3 links |
| Repeated characters | +20 | Same character 5+ times |
| Excessive caps | +15 | >70% capitalized |
| Spam keywords | +10 each | Matches spam keyword list |
| Rate limit exceeded | +30 | Too many posts per hour |
| Duplicate content | +35 | >80% similar to recent post |
| Posting too fast | +25 | <10 seconds since last post |

## Detection Rules

### Content Rules

```typescript
const SPAM_RULES = {
  // Minimum content length
  MIN_CONTENT_LENGTH: 50,

  // Maximum links allowed
  MAX_LINKS_PER_POST: 3,

  // Maximum repeated characters
  MAX_REPEATED_CHARS: 5,

  // Maximum percentage of capitals
  MAX_CAPS_PERCENTAGE: 0.7,

  // Spam keywords
  SPAM_KEYWORDS: [
    'buy now', 'click here', 'limited time',
    'act now', 'free money', 'make money fast',
    'work from home', 'bitcoin', 'cryptocurrency',
    'investment opportunity',
  ],
};
```

### Rate Limits

```typescript
const RATE_LIMITS = {
  MAX_BRIEFS_PER_HOUR: 5,
  MAX_REVIEWS_PER_HOUR: 10,
  MAX_COMMENTS_PER_HOUR: 20,
  MIN_TIME_BETWEEN_POSTS: 10, // seconds
};
```

### Duplicate Detection

Uses Jaccard similarity to compare content:
- Threshold: 80% similarity
- Compares against last 10 posts in 24 hours
- Word-based comparison (case-insensitive)

## Database Schema

### SpamDetectionLog Table

```sql
CREATE TABLE "SpamDetectionLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL, -- 'brief', 'review', 'comment'
  "content" TEXT NOT NULL,
  "spamScore" INTEGER NOT NULL,
  "reasons" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- 'allow', 'flag', 'hide', 'ban'
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

**Indexes:**
- `userId` - Find all logs for a user
- `action` - Filter by action taken
- `spamScore` (DESC) - Find highest spam scores
- `createdAt` (DESC) - Recent logs first

## Implementation

### 1. Server Actions

**File**: `src/server/actions/moderation/spam-detection.ts`

```typescript
import {
  checkSpam,
  getUserSpamScore,
  getSpamReports,
} from '@/server/actions/moderation/spam-detection';
```

#### Check Content for Spam

```typescript
const result = await checkSpam(content, 'brief');

// result contains:
// {
//   isSpam: boolean,
//   confidence: number (0-100),
//   reasons: string[],
//   action: 'allow' | 'flag' | 'hide' | 'ban'
// }

if (result.action === 'ban') {
  // Block submission
  return { error: 'Content blocked as spam' };
}

if (result.action === 'hide') {
  // Create but hide content
  await createBrief({ ...data, hidden: true });
}

if (result.action === 'flag') {
  // Create with flag for review
  await createBrief({ ...data, flagged: true });
}
```

#### Get User Spam Score

```typescript
const result = await getUserSpamScore(userId);

// result.data contains:
// {
//   averageScore: number,
//   recentLogs: Log[],
//   isFlagged: boolean
// }
```

#### Get Spam Reports (Admin)

```typescript
const result = await getSpamReports({
  limit: 50,
  offset: 0,
  action: 'ban', // optional filter
});

// result.data contains:
// {
//   reports: Log[],
//   total: number,
//   hasMore: boolean
// }
```

### 2. React Query Hooks

**File**: `src/hooks/mutations/useSpamDetection.ts`

```typescript
import {
  useSpamCheck,
  useUserSpamScore,
  useSpamReports,
  checkContentBeforeSubmit,
} from '@/hooks/mutations/useSpamDetection';
```

#### Check Content

```typescript
'use client';

const spamCheck = useSpamCheck();

const handleSubmit = async (content: string) => {
  const result = await spamCheck.mutateAsync({
    content,
    type: 'brief',
  });

  if (result.action === 'ban' || result.action === 'hide') {
    // Block submission
    return;
  }

  // Proceed with submission
  await createBrief(content);
};
```

#### Helper Function

```typescript
import { checkContentBeforeSubmit } from '@/hooks/mutations/useSpamDetection';

const handleSubmit = async (content: string) => {
  // Returns false if content should be blocked
  const allowed = await checkContentBeforeSubmit(content, 'brief');

  if (!allowed) {
    return; // Blocked - toast shown automatically
  }

  // Proceed with submission
  await createBrief(content);
};
```

#### Get User Score

```typescript
const { data: spamData } = useUserSpamScore(userId);

if (spamData?.isFlagged) {
  console.log('User is flagged as potential spammer');
  console.log('Average spam score:', spamData.averageScore);
}
```

### 3. UI Components

#### SpamReportsTable (Admin)

**File**: `src/components/moderation/SpamReportsTable.tsx`

```typescript
import { SpamReportsTable } from '@/components/moderation/SpamReportsTable';

// In admin moderation page
<SpamReportsTable />
```

Features:
- Filter by action (all/flag/hide/ban)
- Pagination
- User details
- Content preview
- Spam score badges
- Reasons display

## Usage Examples

### Example 1: Spam Check on Brief Creation

```typescript
// src/server/actions/briefs/create.ts
import { checkSpam } from '@/server/actions/moderation/spam-detection';

export async function createBrief(data: BriefData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Check for spam
  const spamCheck = await checkSpam(data.content, 'brief');

  if (spamCheck.action === 'ban') {
    return {
      success: false,
      error: 'Content blocked as spam',
    };
  }

  // Create brief
  const brief = await prisma.brief.create({
    data: {
      ...data,
      authorId: session.user.id,
      hidden: spamCheck.action === 'hide',
      flagged: spamCheck.action === 'flag',
    },
  });

  return { success: true, data: brief };
}
```

### Example 2: Spam Check on Review Creation

```typescript
// src/server/actions/reviews/create.ts
import { checkSpam } from '@/server/actions/moderation/spam-detection';

export async function createReview(briefId: string, data: ReviewData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Check for spam
  const spamCheck = await checkSpam(data.comment, 'review');

  if (spamCheck.action === 'ban') {
    return {
      success: false,
      error: 'Review blocked as spam',
    };
  }

  if (spamCheck.action === 'hide') {
    return {
      success: false,
      error: 'Review flagged for review',
    };
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      ...data,
      briefId,
      userId: session.user.id,
      flagged: spamCheck.action === 'flag',
    },
  });

  return { success: true, data: review };
}
```

### Example 3: Client-Side Check Before Submit

```typescript
'use client';

import { checkContentBeforeSubmit } from '@/hooks/mutations/useSpamDetection';

export function CreateBriefForm() {
  const [content, setContent] = useState('');
  const createBrief = useCreateBrief();

  const handleSubmit = async () => {
    // Check spam before submitting
    const allowed = await checkContentBeforeSubmit(content, 'brief');

    if (!allowed) {
      // Blocked - toast shown automatically
      return;
    }

    // Proceed with creation
    await createBrief.mutateAsync({ content });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button type="submit">Create Brief</button>
    </form>
  );
}
```

### Example 4: Admin Moderation Dashboard

```typescript
// src/app/admin/moderation/page.tsx
import { SpamReportsTable } from '@/components/moderation/SpamReportsTable';

export default function ModerationPage() {
  return (
    <div className="container py-8">
      <h1>Spam Detection Reports</h1>
      <SpamReportsTable />
    </div>
  );
}
```

### Example 5: User Profile Spam Score

```typescript
'use client';

import { useUserSpamScore } from '@/hooks/mutations/useSpamDetection';

export function UserProfile({ userId }: { userId: string }) {
  const { data: spamData } = useUserSpamScore(userId);

  return (
    <div>
      {spamData?.isFlagged && (
        <Alert variant="destructive">
          <AlertTitle>Flagged User</AlertTitle>
          <AlertDescription>
            This user has been flagged for suspicious activity
            (avg score: {spamData.averageScore.toFixed(1)})
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Customization

### Adding Spam Keywords

```typescript
// src/server/actions/moderation/spam-detection.ts

const SPAM_KEYWORDS = [
  // Default keywords
  'buy now',
  'click here',

  // Add custom keywords
  'your-custom-keyword',
  'another-spam-phrase',
];
```

### Adjusting Thresholds

```typescript
const SPAM_THRESHOLDS = {
  LOW: 30,      // Change to 20 for more sensitive detection
  MEDIUM: 60,   // Change to 50 for stricter moderation
  HIGH: 80,     // Adjust as needed
  CRITICAL: 95, // Instant ban threshold
};
```

### Adjusting Rate Limits

```typescript
const SPAM_RULES = {
  MAX_BRIEFS_PER_HOUR: 5,    // Reduce to 3 for stricter limits
  MAX_REVIEWS_PER_HOUR: 10,  // Increase to 20 for more lenient limits
  MAX_COMMENTS_PER_HOUR: 20,
};
```

## Advanced Features

### 1. Machine Learning Integration (Future)

Replace rule-based detection with ML model:

```typescript
async function checkSpamWithML(content: string): Promise<number> {
  const response = await fetch('/api/ml/spam-check', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

  const { spamProbability } = await response.json();
  return spamProbability * 100; // 0-100 score
}
```

### 2. IP-Based Detection

Track spam by IP address:

```typescript
// Check if IP has multiple spam reports
const ipSpamCount = await prisma.spamDetectionLog.count({
  where: {
    // Assuming you store IP addresses
    ipAddress: userIp,
    spamScore: { gte: 60 },
    createdAt: { gte: oneDayAgo },
  },
});

if (ipSpamCount > 5) {
  // Block IP temporarily
}
```

### 3. Pattern Learning

Track which patterns lead to manual confirmations:

```typescript
// After admin reviews and confirms spam
await prisma.spamPattern.create({
  data: {
    pattern: extractedPattern,
    confirmed: true,
    weight: 20, // Add to spam score
  },
});
```

## Best Practices

### 1. Balance Detection Sensitivity

- Too strict: Legitimate users blocked
- Too lenient: Spam gets through
- Monitor false positives and adjust thresholds

### 2. Provide User Feedback

```typescript
if (spamCheck.action === 'flag') {
  toast.warning('Content under review', {
    description: 'Your post will be reviewed by moderators within 24 hours',
  });
}
```

### 3. Allow Appeals

Create an appeal system for false positives:

```typescript
export async function appealSpamFlag(logId: string, reason: string) {
  await prisma.spamAppeal.create({
    data: {
      logId,
      reason,
      status: 'pending',
    },
  });
}
```

### 4. Regular Review

Schedule regular review of spam logs to adjust rules:
- Weekly: Review flagged content
- Monthly: Analyze false positives
- Quarterly: Update spam keywords

### 5. Whitelist Trusted Users

```typescript
// Skip spam check for trusted users
const userReputation = await getUserReputation(userId);

if (userReputation.level >= 5) {
  // Skip spam check for established users
  return { isSpam: false, confidence: 0, reasons: [], action: 'allow' };
}
```

## Performance Considerations

### 1. Caching

Cache spam check results for identical content:

```typescript
const cacheKey = `spam:${hashContent(content)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// Perform check
const result = await checkSpam(content, type);

// Cache for 1 hour
await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
```

### 2. Async Processing

For non-critical checks, process asynchronously:

```typescript
// Create content first
const brief = await createBrief(data);

// Check spam asynchronously
checkSpam(brief.content, 'brief').then(async (result) => {
  if (result.action !== 'allow') {
    await updateBrief(brief.id, { flagged: true });
  }
});
```

### 3. Database Indexes

Already implemented:
- `userId` - Fast user lookup
- `spamScore` DESC - Find high-risk content
- `createdAt` DESC - Recent activity
- `action` - Filter by action type

## Troubleshooting

### Issue: Too many false positives

**Solutions:**
1. Lower spam score thresholds
2. Remove overly broad spam keywords
3. Whitelist trusted user levels
4. Allow users to appeal

### Issue: Spam getting through

**Solutions:**
1. Add more spam keywords
2. Lower spam score thresholds
3. Implement IP-based detection
4. Add ML-based detection

### Issue: Performance issues

**Solutions:**
1. Add caching for duplicate checks
2. Process checks asynchronously
3. Limit lookback window for duplicate detection
4. Add database indexes

## Future Enhancements

- [ ] Machine learning spam classifier
- [ ] Image spam detection (OCR for text in images)
- [ ] Link reputation checking (check against spam link databases)
- [ ] Account age and activity weighting
- [ ] IP-based spam detection
- [ ] Pattern learning from manual reviews
- [ ] Appeal system for false positives
- [ ] Automated spam keyword updates
- [ ] Cross-platform spam detection (detect same spam across briefs/reviews)
- [ ] Real-time spam dashboard for admins

---

**Last Updated**: December 29, 2025
**Status**: Production Ready
**Dependencies**: Prisma, React Query, Sonner (for toasts)
