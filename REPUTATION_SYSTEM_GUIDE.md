# User Reputation System Guide

## Overview

DeepScholar includes a comprehensive gamification system with reputation points, levels, ranks, badges, activity streaks, and leaderboards to encourage user engagement and reward quality contributions.

## Features

### 1. Reputation Points

Users earn points for various actions:

| Action | Points | Description |
|--------|--------|-------------|
| Brief Published | 10 | Publishing a new research brief |
| Upvote Received | 5 | Someone upvotes your brief |
| Review Written | 3 | Writing a review on a brief |
| Review Helpful | 5 | Your review is marked as helpful |
| Follower Gained | 2 | Someone follows you |
| Brief Featured | 50 | Your brief is featured by admins |
| Daily Login | 1 | Logging in daily (with streak tracking) |

### 2. Ranks and Levels

Users progress through 10 ranks based on total points:

| Level | Rank | Min Points |
|-------|------|------------|
| 1 | Beginner | 0 |
| 2 | Novice | 50 |
| 3 | Contributor | 150 |
| 4 | Regular | 300 |
| 5 | Established | 500 |
| 6 | Trusted | 800 |
| 7 | Expert | 1,200 |
| 8 | Master | 1,800 |
| 9 | Legend | 2,500 |
| 10 | Icon | 5,000 |

### 3. Badges

17 pre-seeded badges across 6 categories:

#### Creation Badges
- **First Brief** (Common) - Published your first research brief
- **Prolific Writer** (Uncommon) - Published 10 research briefs
- **Research Master** (Rare) - Published 50 research briefs
- **Scholar** (Epic) - Published 100 research briefs

#### Community Badges
- **First Review** (Common) - Wrote your first review
- **Critical Thinker** (Uncommon) - Wrote 25 reviews
- **Review Expert** (Rare) - Wrote 100 reviews

#### Popularity Badges
- **Rising Star** (Common) - Received 10 upvotes
- **Popular** (Uncommon) - Received 50 upvotes
- **Viral** (Rare) - Received 200 upvotes

#### Quality Badges
- **Helpful** (Uncommon) - Had 10 reviews marked as helpful
- **Invaluable** (Rare) - Had 50 reviews marked as helpful

#### Social Badges
- **Influencer** (Uncommon) - Gained 25 followers
- **Community Leader** (Rare) - Gained 100 followers

#### Dedication Badges
- **Consistent** (Uncommon) - 7-day activity streak
- **Dedicated** (Rare) - 30-day activity streak
- **Unstoppable** (Epic) - 100-day activity streak

### 4. Activity Streaks

- **Current Streak**: Consecutive days with activity
- **Longest Streak**: All-time longest streak
- **Daily Login Bonus**: 1 point per day

Streaks are broken if no activity for 2+ days.

### 5. Leaderboards

Three timeframes:
- **All-Time**: Total points accumulated
- **This Month**: Points earned in last 30 days
- **This Week**: Points earned in last 7 days

## Database Schema

### UserReputation Table

```sql
CREATE TABLE "UserReputation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,

  -- Reputation
  "points" INTEGER DEFAULT 0,
  "level" INTEGER DEFAULT 1,
  "rank" TEXT DEFAULT 'Beginner',

  -- Activity Counters
  "briefsPublished" INTEGER DEFAULT 0,
  "reviewsWritten" INTEGER DEFAULT 0,
  "upvotesReceived" INTEGER DEFAULT 0,
  "helpfulReviews" INTEGER DEFAULT 0,
  "followersCount" INTEGER DEFAULT 0,

  -- Streaks
  "currentStreak" INTEGER DEFAULT 0,
  "longestStreak" INTEGER DEFAULT 0,
  "lastActivityDate" DATETIME,

  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### Badge Table

```sql
CREATE TABLE "Badge" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "rarity" TEXT DEFAULT 'common',

  -- Requirements (one of these):
  "requiredPoints" INTEGER,
  "requiredAction" TEXT,
  "requiredCount" INTEGER,

  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### UserBadge Table

```sql
CREATE TABLE "UserBadge" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "earnedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE,

  UNIQUE("userId", "badgeId")
);
```

### ReputationHistory Table

```sql
CREATE TABLE "ReputationHistory" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" TEXT,
  "relatedId" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## Implementation

### 1. Server Actions

**File**: `src/server/actions/reputation/reputation.ts`

```typescript
import {
  getUserReputation,
  awardReputationPoints,
  updateActivityCounter,
  updateActivityStreak,
  getUserBadges,
  getLeaderboard,
  getReputationHistory,
  REPUTATION_VALUES,
} from '@/server/actions/reputation/reputation';
```

#### Award Points

```typescript
const result = await awardReputationPoints(
  userId,
  'BRIEF_PUBLISHED',
  'Published: AI in Healthcare',
  briefId
);

// result.data contains:
// - previousPoints
// - newPoints
// - pointsAdded
// - levelUp (boolean)
// - newLevel
// - newRank
```

#### Update Activity Counter

```typescript
await updateActivityCounter(userId, 'briefsPublished', 1);
await updateActivityCounter(userId, 'upvotesReceived', 1);
```

#### Update Streak

```typescript
const result = await updateActivityStreak(userId);
// Automatically awards daily login bonus
// Increments or resets streak based on last activity
```

### 2. React Query Hooks

**File**: `src/hooks/mutations/useReputationMutations.ts`

#### Get Reputation

```typescript
'use client';

import { useReputation } from '@/hooks/mutations/useReputationMutations';

export function UserProfile({ userId }: { userId: string }) {
  const { data: reputation, isLoading } = useReputation(userId);

  if (isLoading) return <Loader />;

  return (
    <div>
      <p>{reputation.rank} - Level {reputation.level}</p>
      <p>{reputation.points} points</p>
    </div>
  );
}
```

#### Award Points (with automatic cache invalidation)

```typescript
import { useAwardPoints } from '@/hooks/mutations/useReputationMutations';

const awardPoints = useAwardPoints();

const handlePublish = async () => {
  await publishBrief(data);

  // Award points
  awardPoints.mutate({
    userId: session.user.id,
    action: 'BRIEF_PUBLISHED',
    reason: `Published: ${data.title}`,
    relatedId: brief.id,
  });
  // Automatically shows level-up toast notification
  // Automatically invalidates reputation, badges, leaderboard caches
};
```

#### Helper Hooks

```typescript
import {
  useAwardBriefPublished,
  useAwardUpvoteReceived,
  useAwardReviewWritten,
  useAwardReviewHelpful,
  useAwardFollowerGained,
} from '@/hooks/mutations/useReputationMutations';

// Simplified usage
const awardBriefPublished = useAwardBriefPublished();

awardBriefPublished.mutate({
  userId: session.user.id,
  briefId: brief.id,
  briefTitle: brief.title,
});
```

### 3. UI Components

#### ReputationBadge

Display user's rank and level:

```typescript
import { ReputationBadge, CompactReputationBadge } from '@/components/reputation/ReputationBadge';

// Full badge
<ReputationBadge
  userId={user.id}
  showPoints={true}
  showLevel={true}
  size="md"
/>

// Compact version
<CompactReputationBadge userId={user.id} />
```

#### BadgeDisplay

Show earned badges:

```typescript
import { BadgeDisplay, CompactBadgeList } from '@/components/reputation/BadgeDisplay';

// Full badge grid
<BadgeDisplay userId={user.id} />

// Limited display
<BadgeDisplay userId={user.id} limit={6} />

// Compact badge list for profiles
<CompactBadgeList userId={user.id} limit={3} />
```

#### ReputationProgress

Progress bar to next level:

```typescript
import { ReputationProgress, CompactReputationProgress } from '@/components/reputation/ReputationProgress';

// Full progress card with stats
<ReputationProgress userId={user.id} showDetails={true} />

// Compact progress bar
<CompactReputationProgress userId={user.id} />
```

#### Leaderboard

Rankings table:

```typescript
import { Leaderboard, MiniLeaderboard } from '@/components/reputation/Leaderboard';

// Full leaderboard with tabs
<Leaderboard limit={10} />

// Mini leaderboard for sidebar
<MiniLeaderboard limit={5} />
```

#### ReputationHistory

Point history:

```typescript
import { ReputationHistory, CompactReputationHistory } from '@/components/reputation/ReputationHistory';

// Full history with pagination
<ReputationHistory userId={user.id} limit={20} />

// Compact recent activity
<CompactReputationHistory userId={user.id} limit={5} />
```

## Integration Examples

### Example 1: Award Points on Brief Publish

```typescript
// src/server/actions/briefs/create.ts
import { awardReputationPoints } from '@/server/actions/reputation/reputation';

export async function publishBrief(data: BriefData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Create brief
  const brief = await prisma.brief.create({
    data: { ...data, authorId: session.user.id },
  });

  // Award reputation points
  await awardReputationPoints(
    session.user.id,
    'BRIEF_PUBLISHED',
    `Published: ${brief.title}`,
    brief.id
  );

  return brief;
}
```

### Example 2: Award Points on Upvote

```typescript
// src/server/actions/briefs/upvote.ts
import { awardReputationPoints } from '@/server/actions/reputation/reputation';

export async function upvoteBrief(briefId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Create upvote
  const upvote = await prisma.upvote.create({
    data: {
      briefId,
      userId: session.user.id,
    },
  });

  // Get brief author
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { authorId: true },
  });

  // Award points to brief author (not upvoter)
  if (brief) {
    await awardReputationPoints(
      brief.authorId,
      'BRIEF_UPVOTE_RECEIVED',
      'Received upvote on brief',
      briefId
    );
  }

  return upvote;
}
```

### Example 3: Display on User Profile

```typescript
// src/app/profile/[id]/page.tsx
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { BadgeDisplay } from '@/components/reputation/BadgeDisplay';
import { ReputationProgress } from '@/components/reputation/ReputationProgress';

export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* Reputation Badge */}
      <ReputationBadge userId={params.id} />

      {/* Progress to Next Level */}
      <ReputationProgress userId={params.id} showDetails={true} />

      {/* Badges */}
      <BadgeDisplay userId={params.id} />
    </div>
  );
}
```

### Example 4: Leaderboard Page

```typescript
// src/app/leaderboard/page.tsx
import { Leaderboard } from '@/components/reputation/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Top Contributors</h1>
      <Leaderboard limit={50} />
    </div>
  );
}
```

### Example 5: Dashboard Widget

```typescript
// src/app/dashboard/page.tsx
import { ReputationProgress } from '@/components/reputation/ReputationProgress';
import { MiniLeaderboard } from '@/components/reputation/Leaderboard';
import { CompactReputationHistory } from '@/components/reputation/ReputationHistory';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Your Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ReputationProgress showDetails={true} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <CompactReputationHistory limit={5} />
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLeaderboard limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Activity Streak Logic

The streak system works as follows:

```typescript
// Day 0: No activity yet → currentStreak = 0
// Day 1: First login → currentStreak = 1
// Day 2: Login next day → currentStreak = 2
// Day 3: Login next day → currentStreak = 3
// Day 5: Login after 2 days → currentStreak = 1 (reset)
```

**Streak Tracking**:
- Call `updateActivityStreak(userId)` on any user action
- Automatically awards 1 point for daily login
- Increments streak if last activity was yesterday
- Resets to 1 if last activity was 2+ days ago
- Updates `longestStreak` if current exceeds it

## Badge Auto-Award Logic

Badges are automatically checked and awarded when:
1. Reputation points change
2. Activity counters update
3. Activity streak updates

The system:
1. Fetches all badges user doesn't have
2. Checks each badge's requirements:
   - **Point-based**: `reputation.points >= badge.requiredPoints`
   - **Action-based**: `reputation[counterField] >= badge.requiredCount`
3. Awards badge if requirements met
4. Creates entry in `UserBadge` table

## Admin Features

### Create Custom Badge

```typescript
await prisma.badge.create({
  data: {
    name: 'Beta Tester',
    description: 'Participated in the beta program',
    icon: '🧪',
    category: 'special',
    rarity: 'rare',
    // No requirements - manually awarded
  },
});
```

### Manually Award Badge

```typescript
await prisma.userBadge.create({
  data: {
    userId: user.id,
    badgeId: badge.id,
  },
});
```

### Feature a Brief (50 points)

```typescript
await awardReputationPoints(
  authorId,
  'BRIEF_FEATURED',
  'Your brief was featured!',
  briefId
);
```

## Performance Considerations

### Caching Strategy

- **Reputation**: 5 minutes stale time
- **Badges**: 10 minutes stale time
- **Leaderboard**: 5 minutes stale time
- **History**: 5 minutes stale time

### Optimizations

1. **Batch Updates**: Group multiple counter updates
2. **Lazy Badge Checking**: Only check after point/counter changes
3. **Leaderboard Caching**: Pre-compute weekly/monthly leaderboards
4. **History Pagination**: Load history in chunks

### Database Indexes

Already created in migration:
- `UserReputation_userId_idx`
- `UserReputation_points_idx`
- `UserReputation_level_idx`
- `UserBadge_userId_idx`
- `UserBadge_badgeId_idx`
- `ReputationHistory_userId_idx`
- `ReputationHistory_createdAt_idx`

## Best Practices

### 1. Always Award Points on Success

```typescript
// ✅ Good
const brief = await createBrief(data);
await awardReputationPoints(userId, 'BRIEF_PUBLISHED', ...);

// ❌ Bad - awards even on failure
await awardReputationPoints(userId, 'BRIEF_PUBLISHED', ...);
const brief = await createBrief(data);
```

### 2. Award to Correct User

```typescript
// ✅ Good - award to brief author
await awardReputationPoints(
  brief.authorId,
  'BRIEF_UPVOTE_RECEIVED',
  ...
);

// ❌ Bad - awards to upvoter
await awardReputationPoints(
  session.user.id,
  'BRIEF_UPVOTE_RECEIVED',
  ...
);
```

### 3. Use Helper Hooks for Consistency

```typescript
// ✅ Good - uses helper
const awardBriefPublished = useAwardBriefPublished();
awardBriefPublished.mutate({ userId, briefId, briefTitle });

// ⚠️ Acceptable but verbose
const awardPoints = useAwardPoints();
awardPoints.mutate({
  userId,
  action: 'BRIEF_PUBLISHED',
  reason: `Published: ${briefTitle}`,
  relatedId: briefId,
});
```

### 4. Provide Meaningful Reasons

```typescript
// ✅ Good
await awardReputationPoints(
  userId,
  'BRIEF_PUBLISHED',
  `Published: ${brief.title}`,
  brief.id
);

// ❌ Bad - generic
await awardReputationPoints(
  userId,
  'BRIEF_PUBLISHED',
  'Published brief'
);
```

## Troubleshooting

### Issue: Level-up toast not showing

**Solution**: Ensure `toast` provider is in layout:

```typescript
// app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

### Issue: Badges not auto-awarding

**Check**:
1. Badge requirements are correctly set
2. Activity counters are being updated
3. `checkAndAwardBadges()` is called after updates

### Issue: Streak not incrementing

**Solution**: Call `updateActivityStreak()` on any user action, not just login.

## Future Enhancements

- [ ] Achievements system (combination of multiple badges)
- [ ] Weekly challenges
- [ ] Point multipliers for special events
- [ ] Reputation decay for inactive users
- [ ] Reputation transfer/gifting
- [ ] Badge showcase on profile
- [ ] Animated level-up celebrations
- [ ] Push notifications for level-ups
- [ ] Email digest of weekly progress
- [ ] Social sharing of achievements

---

**Last Updated**: December 29, 2025
**Status**: Production Ready
**Dependencies**: Prisma, React Query, Sonner (for toasts)
**Database**: SQLite (can be adapted to PostgreSQL/MySQL)
