# DeepScholar Comprehensive Caching Strategy

## Executive Summary

Implement a multi-layered caching system that:
- Shows cached data instantly (< 10ms)
- Fetches fresh data in background
- Prevents UI disruption during updates
- Handles the "clicked-while-updating" race condition
- Respects 30-second freshness window

---

## Architecture Decision: TanStack Query (React Query)

### Why React Query?

1. **Industry Standard** - Battle-tested, used by thousands of production apps
2. **Stale-While-Revalidate** - Shows cached data, fetches new data in background
3. **Race Condition Protection** - Prevents data from being replaced mid-interaction
4. **Smart Deduplication** - Multiple components requesting same data = 1 request
5. **DevTools** - Visual cache inspector for debugging
6. **Automatic Background Refetching** - Configurable, smart refetch strategies
7. **Optimistic Updates** - UI updates before server confirms
8. **Persistence** - Can persist cache to localStorage

### Alternatives Considered

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| SWR | Lighter, Vercel-made | Less features, smaller ecosystem | ❌ Not chosen |
| Custom Hook | Full control | Lots of work, reinventing wheel | ❌ Not chosen |
| **React Query** | **All features, mature, TypeScript** | **Slightly larger** | ✅ **CHOSEN** |

---

## Implementation Plan

### Phase 1: Infrastructure Setup (30-45 min)

#### 1.1 Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### 1.2 Create Query Client Provider
**File**: `src/app/providers/QueryProvider.tsx`
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // CRITICAL: 30 second stale time
            staleTime: 30 * 1000, // Don't refetch if data is < 30s old

            // Cache for 5 minutes after component unmounts
            gcTime: 5 * 60 * 1000,

            // Show stale data while fetching new data
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: true,

            // Retry failed requests
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
```

#### 1.3 Wrap Root Layout
**File**: `src/app/layout.tsx`
```typescript
import { QueryProvider } from './providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {/* existing providers */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

#### 1.4 Create Custom Hooks Directory
**Structure**:
```
src/
  hooks/
    queries/
      useBriefs.ts
      useBrief.ts
      useUserProfile.ts
      useCategories.ts
      useModels.ts
      useSearchResults.ts
    mutations/
      useCreateBrief.ts
      useUpdateBrief.ts
      useUpvoteBrief.ts
```

---

### Phase 2: Core Query Hooks (1-2 hours)

#### 2.1 Brief List Query Hook
**File**: `src/hooks/queries/useBriefs.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getBriefs } from '@/server/actions/explore';

interface UseBriefsParams {
  page?: number;
  sortBy?: string;
  categories?: string[];
  search?: string;
  modelFilter?: string;
}

export function useBriefs(params: UseBriefsParams = {}) {
  return useQuery({
    // Unique key for this query - changes when params change
    queryKey: ['briefs', params],

    // Fetch function
    queryFn: async () => {
      const result = await getBriefs(params);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch briefs');
      }
      return result.data;
    },

    // Keep previous data while fetching new (prevents layout shift)
    placeholderData: (previousData) => previousData,

    // Optional: Prefetch next page
    // This is commented out for now but can be enabled
    // onSuccess: (data) => {
    //   if (params.page && data.hasNextPage) {
    //     queryClient.prefetchQuery({
    //       queryKey: ['briefs', { ...params, page: params.page + 1 }]
    //     });
    //   }
    // }
  });
}
```

**Key Features**:
- `queryKey` - Cache identifier, automatically refetches when params change
- `placeholderData` - Shows old data while fetching new (no flicker!)
- Automatic error handling
- TypeScript support

#### 2.2 Individual Brief Query Hook
**File**: `src/hooks/queries/useBrief.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getBriefById } from '@/server/actions/briefs/core-operations';

export function useBrief(briefId: string | null) {
  return useQuery({
    queryKey: ['brief', briefId],
    queryFn: async () => {
      if (!briefId) throw new Error('Brief ID required');
      const result = await getBriefById(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brief');
      }
      return result.data;
    },
    enabled: !!briefId, // Only run if briefId exists
    staleTime: 60 * 1000, // Individual briefs stay fresh for 1 minute
  });
}
```

#### 2.3 Categories & Models Query Hooks
**File**: `src/hooks/queries/useCategories.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getAllCategories } from '@/server/actions/explore';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getAllCategories();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    // Categories rarely change, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
```

**File**: `src/hooks/queries/useModels.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getAllModels } from '@/server/actions/explore';

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const result = await getAllModels();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
```

#### 2.4 User Profile Query Hook
**File**: `src/hooks/queries/useUserProfile.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getUserBriefs } from '@/server/actions/briefs/core-operations';
import { getSavedBriefs, getUserReviews, getUserUpvotes } from '@/server/actions/briefs';
import { getUserTokenBalance } from '@/server/actions/tokens';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const [briefs, saved, reviews, upvotes, tokenBalance] = await Promise.all([
        getUserBriefs(),
        getSavedBriefs(),
        getUserReviews(),
        getUserUpvotes(),
        getUserTokenBalance(),
      ]);

      return {
        briefs: briefs.success ? briefs.data : [],
        savedBriefs: saved.success ? saved.data : [],
        reviews: reviews.success ? reviews.data : [],
        upvotes: upvotes.success ? upvotes.data : [],
        tokenBalance: tokenBalance.success ? tokenBalance.balance : 0,
      };
    },
    staleTime: 30 * 1000,
  });
}
```

---

### Phase 3: Loading UI Components (30 min)

#### 3.1 Background Refetch Indicator
**File**: `src/app/components/BackgroundLoadingIndicator.tsx`
```typescript
'use client';

import { useIsFetching } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BackgroundLoadingIndicator() {
  const isFetching = useIsFetching();

  return (
    <AnimatePresence>
      {isFetching > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Updating data...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Usage**: Add to root layout:
```typescript
<QueryProvider>
  <BackgroundLoadingIndicator />
  {children}
</QueryProvider>
```

#### 3.2 Query Status Component
**File**: `src/app/components/QueryStatus.tsx`
```typescript
import { UseQueryResult } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';

interface QueryStatusProps {
  query: UseQueryResult;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function QueryStatus({
  query,
  loadingComponent,
  errorComponent
}: QueryStatusProps) {
  // Initial loading (no cached data)
  if (query.isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (query.isError) {
    return errorComponent || (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{query.error?.message || 'An error occurred'}</span>
      </div>
    );
  }

  return null;
}
```

---

### Phase 4: Refactor Pages to Use Queries (2-3 hours)

#### 4.1 Briefs Page Refactor
**File**: `src/app/briefs/page.tsx`

**Before** (current):
```typescript
const [briefs, setBriefs] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchBriefs = async () => {
    setLoading(true);
    const result = await getBriefs({ ... });
    setBriefs(result.data);
    setLoading(false);
  };
  fetchBriefs();
}, [page, sortBy, search]);
```

**After** (with React Query):
```typescript
import { useBriefs } from '@/hooks/queries/useBriefs';
import { QueryStatus } from '@/app/components/QueryStatus';

// Inside component:
const briefsQuery = useBriefs({
  page,
  sortBy,
  categories: selectedCategories,
  search: searchQuery,
  modelFilter: selectedModel,
});

// Loading/Error handling
<QueryStatus query={briefsQuery} />

// Render data - it's ALWAYS available (cached or fresh)
{briefsQuery.data?.map(brief => (
  <BriefCard key={brief.id} {...brief} />
))}

// Optional: Show background refresh indicator
{briefsQuery.isFetching && !briefsQuery.isLoading && (
  <div className="text-sm text-gray-500">
    Refreshing...
  </div>
)}
```

**Benefits**:
- ✅ Instant load from cache
- ✅ Automatic refetch when params change
- ✅ No layout shift during updates
- ✅ Deduplicates requests
- ✅ Background refetching

#### 4.2 Home Page Refactor
**File**: `src/app/home/page.tsx`
```typescript
import { useBriefs } from '@/hooks/queries/useBriefs';
import { useQuery } from '@tanstack/react-query';
import { getBriefStats } from '@/server/actions/home';

const statsQuery = useQuery({
  queryKey: ['briefStats'],
  queryFn: async () => {
    const result = await getBriefStats();
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
  staleTime: 60 * 1000, // Stats cached for 1 minute
});

const recentBriefsQuery = useBriefs({
  sortBy: 'recent',
  limit: 3,
});

// Render with cached data immediately
<StatsSection stats={statsQuery.data} loading={statsQuery.isLoading} />
<RecentBriefs briefs={recentBriefsQuery.data} />
```

#### 4.3 Profile Page Refactor
**File**: `src/app/profile/page.tsx`
```typescript
import { useUserProfile } from '@/hooks/queries/useUserProfile';

const profileQuery = useUserProfile();

// Data is instantly available from cache
const stats = {
  briefs: profileQuery.data?.briefs.length ?? 0,
  reviews: profileQuery.data?.reviews.length ?? 0,
  tokenBalance: profileQuery.data?.tokenBalance ?? 0,
};
```

---

### Phase 5: Mutation Hooks (Optimistic Updates) (1-2 hours)

#### 5.1 Upvote Mutation
**File**: `src/hooks/mutations/useUpvoteBrief.ts`
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleUpvote } from '@/server/actions/briefs';

export function useUpvoteBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await toggleUpvote(briefId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    // OPTIMISTIC UPDATE - UI updates instantly
    onMutate: async (briefId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['brief', briefId] });
      await queryClient.cancelQueries({ queryKey: ['briefs'] });

      // Snapshot current data
      const previousBrief = queryClient.getQueryData(['brief', briefId]);

      // Optimistically update cache
      queryClient.setQueryData(['brief', briefId], (old: any) => ({
        ...old,
        upvotes: old.hasUpvoted
          ? old.upvotes.filter((u: any) => u.userId !== 'current-user')
          : [...old.upvotes, { userId: 'current-user' }],
        hasUpvoted: !old.hasUpvoted,
      }));

      return { previousBrief };
    },

    // Rollback on error
    onError: (err, briefId, context) => {
      if (context?.previousBrief) {
        queryClient.setQueryData(['brief', briefId], context.previousBrief);
      }
    },

    // Always refetch after mutation
    onSettled: (data, error, briefId) => {
      queryClient.invalidateQueries({ queryKey: ['brief', briefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}
```

**Usage in component**:
```typescript
const upvoteMutation = useUpvoteBrief();

<button
  onClick={() => upvoteMutation.mutate(brief.id)}
  disabled={upvoteMutation.isPending}
>
  {upvoteMutation.isPending ? 'Upvoting...' : 'Upvote'}
</button>
```

**Result**: Button click shows upvote immediately, even before server responds!

---

### Phase 6: Preventing "Clicked While Updating" Issues

#### 6.1 The Problem
User scenario:
1. User sees brief card at position Y
2. Background refetch starts
3. New data arrives, re-sorts list
4. Brief card moves to position Z
5. User clicks where Y was → clicks wrong brief!

#### 6.2 Solution: Multiple Strategies

**Strategy A: Use `placeholderData`** (RECOMMENDED)
```typescript
const briefsQuery = useBriefs(params, {
  placeholderData: (previousData) => previousData,
});
```
- Keeps old data visible during refetch
- New data only replaces when render completes
- No layout shift!

**Strategy B: Interaction Lock**
```typescript
const [isInteracting, setIsInteracting] = useState(false);

return useBriefs(params, {
  enabled: !isInteracting, // Don't refetch while user interacting
});
```

**Strategy C: Optimistic Scroll Position**
```typescript
const scrollPositionRef = useRef(0);

useEffect(() => {
  if (briefsQuery.isFetching && !briefsQuery.isLoading) {
    // Save scroll position
    scrollPositionRef.current = window.scrollY;
  }
}, [briefsQuery.isFetching]);

useEffect(() => {
  if (!briefsQuery.isFetching && scrollPositionRef.current > 0) {
    // Restore scroll position after update
    window.scrollTo(0, scrollPositionRef.current);
    scrollPositionRef.current = 0;
  }
}, [briefsQuery.isFetching]);
```

**Strategy D: Debounced Updates** (for search)
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebouncedValue(searchInput, 300);

const briefsQuery = useBriefs({
  search: debouncedSearch, // Only query after user stops typing
});
```

---

### Phase 7: Server-Side Caching (Next.js 15)

#### 7.1 Cache Server Actions
**File**: `src/server/actions/briefs/core-operations.ts`

**Before**:
```typescript
export async function getBriefs(params) {
  const briefs = await db.brief.findMany({ ... });
  return { success: true, data: briefs };
}
```

**After**:
```typescript
import { unstable_cache } from 'next/cache';

export const getBriefs = unstable_cache(
  async (params) => {
    const briefs = await db.brief.findMany({ ... });
    return { success: true, data: briefs };
  },
  ['briefs-list'], // Cache key
  {
    revalidate: 30, // Revalidate every 30 seconds
    tags: ['briefs'], // Invalidation tag
  }
);
```

#### 7.2 Cache Invalidation on Mutations
```typescript
import { revalidateTag } from 'next/cache';

export async function createBrief(data) {
  const brief = await db.brief.create({ data });

  // Invalidate briefs cache
  revalidateTag('briefs');

  return { success: true, data: brief };
}
```

---

### Phase 8: Prefetching on Hover

#### 8.1 Prefetch Hook
**File**: `src/hooks/usePrefetch.ts`
```typescript
import { useQueryClient } from '@tanstack/react-query';

export function usePrefetchBrief() {
  const queryClient = useQueryClient();

  return (briefId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['brief', briefId],
      queryFn: async () => {
        const result = await getBriefById(briefId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  };
}
```

#### 8.2 Use in Brief Card
```typescript
const prefetchBrief = usePrefetchBrief();

<Link
  href={`/briefs/${brief.id}`}
  onMouseEnter={() => prefetchBrief(brief.id)}
  onTouchStart={() => prefetchBrief(brief.id)}
>
  {brief.title}
</Link>
```

**Result**: Brief page loads instantly when clicked!

---

## Cache Persistence (Optional Enhancement)

### Persist Cache to LocalStorage
```typescript
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({ ... });

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

**Benefits**:
- Cache survives page refresh
- Works offline
- Faster initial load

---

## Performance Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Initial Load (cached)** | 500-1000ms | < 10ms | **50-100x faster** |
| **Background Refetch** | Blocks UI | Silent | **No UI impact** |
| **Duplicate Requests** | Multiple | Deduplicated | **Bandwidth saved** |
| **Layout Shift** | Frequent | None | **Better UX** |
| **Click Reliability** | Can misclick | Stable | **No race conditions** |

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/briefs` → See instant load from cache
- [ ] Wait 31 seconds → See background refetch indicator
- [ ] Click brief card during refetch → Card doesn't move
- [ ] Open DevTools → See React Query cache inspector
- [ ] Search for brief → See debounced query
- [ ] Upvote a brief → See instant UI update (optimistic)
- [ ] Refresh page → See cache persisted (if enabled)
- [ ] Network throttle (Slow 3G) → Still usable with cache
- [ ] Hover over brief card → See prefetch in Network tab

### Automated Testing
```typescript
// tests/cache.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useBriefs } from '@/hooks/queries/useBriefs';

test('should return cached data immediately', async () => {
  const { result } = renderHook(() => useBriefs());

  // First render: loading
  expect(result.current.isLoading).toBe(true);

  // Wait for data
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  // Unmount and remount
  const { result: result2 } = renderHook(() => useBriefs());

  // Second render: immediate data from cache
  expect(result2.current.data).toBeDefined();
  expect(result2.current.isLoading).toBe(false);
});
```

---

## Migration Strategy

### Incremental Rollout
1. **Week 1**: Install React Query, set up provider
2. **Week 2**: Migrate briefs page only
3. **Week 3**: Migrate home + profile pages
4. **Week 4**: Add mutations + optimistic updates
5. **Week 5**: Server-side caching + prefetching

### Rollback Plan
If issues arise:
1. React Query is opt-in per component
2. Old `useEffect` pattern still works
3. Can rollback by removing React Query usage
4. No database changes required

---

## Maintenance & Monitoring

### DevTools
React Query DevTools shows:
- All cached queries
- Cache staleness
- Active queries
- Mutation status

### Logging
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        logger.error('Query failed', error);
        errorMonitoring.captureException(error);
      },
    },
  },
});
```

---

## Summary

### Implementation Time
- **Phase 1-3** (Setup + Hooks + UI): ~3 hours
- **Phase 4** (Refactor pages): ~3 hours
- **Phase 5-6** (Mutations + Safety): ~2 hours
- **Phase 7-8** (Server cache + Prefetch): ~2 hours
- **Total**: ~10 hours of focused work

### Key Benefits
✅ **Instant loads** from cache
✅ **No layout shifts** during updates
✅ **Prevents click errors** during refetch
✅ **30-second freshness** window
✅ **Background refetch** indicator
✅ **Optimistic updates** for interactions
✅ **Smart deduplication** saves bandwidth
✅ **TypeScript support** throughout
✅ **Developer tools** for debugging
✅ **Production-ready** at scale

### Next Steps
1. Review this plan
2. Ask any questions
3. I'll implement Phase 1-3 first
4. Test and iterate
5. Roll out to all pages

---

## Questions to Consider

1. **Cache Persistence**: Should we enable localStorage persistence?
2. **Prefetching**: Enable hover prefetching on all links?
3. **Background Indicator**: Top-right corner or bottom-right?
4. **Stale Time**: Is 30 seconds right for all queries, or should some be different?
5. **DevTools**: Enable in production for admins only?

Let me know if you'd like me to proceed with implementation!
