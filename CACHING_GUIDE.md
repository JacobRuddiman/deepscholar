# Server-Side Caching Guide

This guide explains how to use the server-side caching system in DeepScholar, built on Next.js's `unstable_cache` API.

## Overview

The caching system provides:
- **Automatic cache management** with tags for selective revalidation
- **Smart cache durations** optimized for different data types
- **Type-safe wrappers** for common query patterns
- **Easy integration** with existing server actions

## Cache Architecture

### Cache Durations

Defined in `src/lib/cache.ts`:

```typescript
export const CACHE_DURATIONS = {
  BRIEF: 60 * 5,              // 5 minutes
  BRIEF_LIST: 60 * 2,         // 2 minutes
  USER: 60 * 10,              // 10 minutes
  USER_PROFILE: 60 * 5,       // 5 minutes
  CATEGORIES: 60 * 30,        // 30 minutes
  STATS: 60 * 15,             // 15 minutes
  SEARCH_RESULTS: 60 * 5,     // 5 minutes
  TRENDING: 60 * 10,          // 10 minutes
};
```

### Cache Tags

Tags allow selective cache invalidation:

```typescript
export const CACHE_TAGS = {
  BRIEFS: 'briefs',                           // All briefs
  BRIEF: (id: string) => `brief-${id}`,       // Specific brief
  USER_BRIEFS: (userId) => `user-briefs-${userId}`,
  SAVED_BRIEFS: (userId) => `saved-briefs-${userId}`,
  USERS: 'users',                             // All users
  USER: (id: string) => `user-${id}`,         // Specific user
  CATEGORIES: 'categories',
  STATS: 'stats',
  SEARCH: 'search',
  TRENDING: 'trending',
  REVIEWS: (briefId) => `reviews-${briefId}`,
};
```

## Using Cached Queries

### Brief Queries

```typescript
import {
  getCachedBriefById,
  getCachedBriefBySlug,
  getCachedPublicBriefs,
  getCachedUserBriefs,
  getCachedSavedBriefs,
  getCachedSearchResults,
  getCachedTrendingBriefs,
  getCachedBriefStats,
} from '@/server/actions/briefs/cached';

// Get a single brief (cached for 5 minutes)
const brief = await getCachedBriefById(briefId);

// Get brief by slug (cached for 5 minutes)
const brief = await getCachedBriefBySlug('my-brief-slug');

// Get public briefs with filters (cached for 2 minutes)
const briefs = await getCachedPublicBriefs({
  limit: 20,
  offset: 0,
  categoryId: 'category-id',
  sortBy: 'trending', // 'recent' | 'popular' | 'trending'
});

// Get user's briefs (cached for 2 minutes)
const userBriefs = await getCachedUserBriefs(userId, {
  limit: 20,
  offset: 0,
});

// Get saved briefs (cached for 2 minutes)
const savedBriefs = await getCachedSavedBriefs(userId, {
  limit: 20,
  offset: 0,
});

// Search briefs (cached for 5 minutes)
const results = await getCachedSearchResults('machine learning', {
  limit: 20,
  categoryId: 'optional-category-id',
});

// Get trending briefs (cached for 10 minutes)
const trending = await getCachedTrendingBriefs(10);

// Get brief statistics (cached for 5 minutes)
const stats = await getCachedBriefStats(briefId);
// Returns: { upvotes, reviews, saves, references, views }
```

### User Queries

```typescript
import {
  getCachedUserById,
  getCachedUserProfile,
  getCachedUserStats,
} from '@/server/actions/cached-queries';

// Get user (cached for 10 minutes)
const user = await getCachedUserById(userId);

// Get user profile with recent briefs (cached for 5 minutes)
const profile = await getCachedUserProfile(userId);

// Get user statistics (cached for 15 minutes)
const stats = await getCachedUserStats(userId);
// Returns: { briefsCreated, reviewsWritten, briefsSaved, ... }
```

### Category Queries

```typescript
import {
  getCachedCategories,
  getCachedCategoryById,
} from '@/server/actions/cached-queries';

// Get all categories (cached for 30 minutes)
const categories = await getCachedCategories();

// Get specific category (cached for 30 minutes)
const category = await getCachedCategoryById(categoryId);
```

### Platform Statistics

```typescript
import {
  getCachedPlatformStats,
} from '@/server/actions/cached-queries';

// Get platform-wide statistics (cached for 15 minutes)
const stats = await getCachedPlatformStats();
// Returns: { totalBriefs, totalUsers, totalReviews, totalCategories, recentBriefs }
```

### Model Queries

```typescript
import {
  getCachedModels,
  getCachedModelById,
} from '@/server/actions/cached-queries';

// Get all AI models (cached for 30 minutes)
const models = await getCachedModels();

// Get specific model (cached for 30 minutes)
const model = await getCachedModelById(modelId);
```

## Cache Invalidation

### Manual Invalidation

When you mutate data, invalidate the relevant caches:

```typescript
import { revalidate, invalidateBriefCache, invalidateUserCache } from '@/lib/cache';

// After creating/updating a brief
invalidateBriefCache(briefId);

// After updating a user
invalidateUserCache(userId);

// Granular invalidation
revalidate.brief(briefId);                  // Invalidate specific brief
revalidate.userBriefs(userId);              // Invalidate user's briefs
revalidate.savedBriefs(userId);             // Invalidate saved briefs
revalidate.allBriefs();                     // Invalidate all briefs
revalidate.trending();                      // Invalidate trending briefs
revalidate.search();                        // Invalidate search results
revalidate.categories();                    // Invalidate categories
revalidate.stats();                         // Invalidate statistics
revalidate.reviews(briefId);                // Invalidate reviews

// Revalidate entire path
revalidate.path('/briefs');
revalidate.path(`/briefs/${briefId}`);
```

### Example Mutation with Invalidation

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { invalidateBriefCache } from '@/lib/cache';

export async function updateBrief(briefId: string, data: any) {
  try {
    const brief = await prisma.brief.update({
      where: { id: briefId },
      data,
    });

    // Invalidate caches
    invalidateBriefCache(briefId);

    return { success: true, data: brief };
  } catch (error) {
    return { success: false, error: 'Failed to update brief' };
  }
}
```

## Creating Custom Cached Functions

### For Single Items

```typescript
import { createBriefCache, CACHE_DURATIONS } from '@/lib/cache';

const getMyCachedData = createBriefCache(
  async (id: string) => {
    // Your query logic here
    return await prisma.myModel.findUnique({ where: { id } });
  },
  CACHE_DURATIONS.BRIEF // Cache duration
);
```

### For Lists

```typescript
import { createBriefListCache, CACHE_DURATIONS } from '@/lib/cache';

const getMyCachedList = createBriefListCache(
  async (options?: { limit?: number }) => {
    // Your query logic here
    return await prisma.myModel.findMany({ take: options?.limit });
  },
  CACHE_DURATIONS.BRIEF_LIST
);
```

### For Search

```typescript
import { createSearchCache, CACHE_DURATIONS } from '@/lib/cache';

const getMyCachedSearch = createSearchCache(
  async (query: string, filters?: any) => {
    // Your search logic here
    return await prisma.myModel.findMany({
      where: { name: { contains: query } },
    });
  },
  CACHE_DURATIONS.SEARCH_RESULTS
);
```

### Generic Cached Function

```typescript
import { createCachedFunction, CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache';

const getMyCachedData = createCachedFunction(
  async (param1: string, param2: number) => {
    // Your logic here
    return await someAsyncOperation(param1, param2);
  },
  {
    tags: [CACHE_TAGS.CUSTOM_TAG],
    revalidate: CACHE_DURATIONS.CUSTOM,
    keyPrefix: 'my-data',
  }
);
```

## Cached Fetch for External APIs

```typescript
import { cachedFetch } from '@/lib/cache';

const response = await cachedFetch('https://api.example.com/data', {
  tags: ['external-api'],
  revalidate: 60 * 5, // 5 minutes
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
```

## Development Utilities

### Cache Debugging

```typescript
import { cacheDebug } from '@/lib/cache';

// Log cache hits/misses (development only)
cacheDebug.log('brief-123', true);  // Cache hit
cacheDebug.log('brief-456', false); // Cache miss

// Measure cache performance
const { data, duration } = await cacheDebug.measure(
  'getCachedBriefs',
  () => getCachedPublicBriefs({ limit: 20 })
);

console.log(`Query took ${duration}ms`);
```

## Best Practices

### 1. Use Appropriate Cache Durations

- **Frequently changing data** (brief lists, search): Short cache (2-5 minutes)
- **Moderately changing data** (user profiles, briefs): Medium cache (5-10 minutes)
- **Rarely changing data** (categories, models): Long cache (30 minutes)
- **Statistical data**: Medium cache (15 minutes)

### 2. Always Invalidate After Mutations

```typescript
// ❌ BAD: No invalidation
export async function updateBrief(id: string, data: any) {
  return await prisma.brief.update({ where: { id }, data });
}

// ✅ GOOD: Proper invalidation
export async function updateBrief(id: string, data: any) {
  const brief = await prisma.brief.update({ where: { id }, data });
  invalidateBriefCache(id);
  return brief;
}
```

### 3. Use Granular Tags

```typescript
// ❌ BAD: Too broad invalidation
revalidate.allBriefs(); // Invalidates everything

// ✅ GOOD: Targeted invalidation
revalidate.brief(briefId);      // Only the specific brief
revalidate.userBriefs(userId);  // Only user's briefs
```

### 4. Cache at the Data Layer

```typescript
// ✅ GOOD: Cache database queries
export const getCachedBriefs = createBriefListCache(
  async () => await prisma.brief.findMany(...)
);

// ❌ AVOID: Caching computed values (use React Query client-side instead)
export const getCachedProcessedBriefs = createBriefListCache(
  async () => {
    const briefs = await prisma.brief.findMany(...);
    return briefs.map(processExpensiveComputation); // Client-side concern
  }
);
```

### 5. Combine with React Query

Server-side cache reduces database load, client-side cache reduces network requests:

```typescript
// Server-side (cached at database level)
export const getCachedBriefs = createBriefListCache(...);

// Client-side (cached in browser)
const { data } = useQuery({
  queryKey: ['briefs'],
  queryFn: async () => {
    const result = await getCachedBriefs(); // Hits server cache if available
    return result;
  },
  staleTime: 60 * 1000, // 1 minute browser cache
});
```

## Performance Impact

### Before Caching
- Database query on every request
- ~50-200ms per query
- High database load

### After Caching
- Cache hit: ~1-5ms
- Cache miss: ~50-200ms (same as before, but rare)
- Significantly reduced database load

## Monitoring

In development, cache hits/misses are logged:

```
[Cache HIT] brief-123
[Cache MISS] brief-456
[Cache] getCachedBriefs took 2.34ms
```

In production, monitor:
- Cache hit ratio
- Average response times
- Database load reduction

## Migration Checklist

To migrate existing queries to use caching:

1. ✅ Identify frequently called read queries
2. ✅ Import appropriate cache function from `@/lib/cache`
3. ✅ Wrap query with cache function
4. ✅ Add cache invalidation to related mutations
5. ✅ Test cache behavior (hits/misses)
6. ✅ Monitor performance improvements

## Troubleshooting

### Stale Data

If you see stale data:
- Check that mutations are invalidating caches
- Verify cache tags are correct
- Consider reducing cache duration

### Cache Not Working

If caching seems ineffective:
- Ensure you're using cached functions
- Check that `unstable_cache` is available (Next.js 14+)
- Verify cache tags in dev tools
- Check for errors in cache function

### Too Much Memory Usage

If cache grows too large:
- Reduce cache durations
- Use more granular tags for selective invalidation
- Consider implementing cache size limits

## Future Enhancements

Planned improvements:
- [ ] Cache size monitoring
- [ ] Automatic cache warming
- [ ] Cache analytics dashboard
- [ ] Redis integration for distributed caching
- [ ] Smarter cache invalidation strategies
