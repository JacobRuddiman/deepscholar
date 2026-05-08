import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Cache configuration and utilities for server-side caching
 */

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  BRIEF: 60 * 5, // 5 minutes
  BRIEF_LIST: 60 * 2, // 2 minutes
  USER: 60 * 10, // 10 minutes
  USER_PROFILE: 60 * 5, // 5 minutes
  CATEGORIES: 60 * 30, // 30 minutes
  STATS: 60 * 15, // 15 minutes
  SEARCH_RESULTS: 60 * 5, // 5 minutes
  TRENDING: 60 * 10, // 10 minutes
} as const;

// Cache tags for selective revalidation
export const CACHE_TAGS = {
  BRIEFS: 'briefs',
  BRIEF: (id: string) => `brief-${id}`,
  USER_BRIEFS: (userId: string) => `user-briefs-${userId}`,
  SAVED_BRIEFS: (userId: string) => `saved-briefs-${userId}`,
  USERS: 'users',
  USER: (id: string) => `user-${id}`,
  CATEGORIES: 'categories',
  STATS: 'stats',
  SEARCH: 'search',
  TRENDING: 'trending',
  REVIEWS: (briefId: string) => `reviews-${briefId}`,
} as const;

/**
 * Create a cached function with automatic tag management
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    tags: string[];
    revalidate?: number;
    keyPrefix?: string;
  }
): T {
  const { tags, revalidate, keyPrefix = 'cache' } = options;

  return unstable_cache(
    fn,
    [keyPrefix, fn.name],
    {
      tags,
      revalidate,
    }
  ) as T;
}

/**
 * Cache a brief by ID
 */
export function createBriefCache<T extends (id: string) => Promise<any>>(
  fn: T,
  revalidate: number = CACHE_DURATIONS.BRIEF
): T {
  return ((...args: Parameters<T>) => {
    const id = args[0] as string;
    const cached = unstable_cache(
      fn,
      ['brief', id],
      {
        tags: [CACHE_TAGS.BRIEFS, CACHE_TAGS.BRIEF(id)],
        revalidate,
      }
    );
    return (cached as any)(...args);
  }) as T;
}

/**
 * Cache a list of briefs with filtering
 */
export function createBriefListCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  revalidate: number = CACHE_DURATIONS.BRIEF_LIST
): T {
  return ((...args: Parameters<T>) => {
    // Create cache key from arguments
    const cacheKey = ['brief-list', JSON.stringify(args)];

    const cached = unstable_cache(
      fn,
      cacheKey,
      {
        tags: [CACHE_TAGS.BRIEFS],
        revalidate,
      }
    );
    return (cached as any)(...args);
  }) as T;
}

/**
 * Cache user data
 */
export function createUserCache<T extends (id: string) => Promise<any>>(
  fn: T,
  revalidate: number = CACHE_DURATIONS.USER
): T {
  return ((...args: Parameters<T>) => {
    const id = args[0] as string;
    const cached = unstable_cache(
      fn,
      ['user', id],
      {
        tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(id)],
        revalidate,
      }
    );
    return (cached as any)(...args);
  }) as T;
}

/**
 * Cache search results
 */
export function createSearchCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  revalidate: number = CACHE_DURATIONS.SEARCH_RESULTS
): T {
  return ((...args: Parameters<T>) => {
    const cacheKey = ['search', JSON.stringify(args)];

    const cached = unstable_cache(
      fn,
      cacheKey,
      {
        tags: [CACHE_TAGS.SEARCH],
        revalidate,
      }
    );
    return (cached as any)(...args);
  }) as T;
}

/**
 * Revalidation utilities
 */
export const revalidate = {
  /**
   * Revalidate all briefs
   */
  allBriefs: () => revalidateTag(CACHE_TAGS.BRIEFS),

  /**
   * Revalidate a specific brief
   */
  brief: (id: string) => revalidateTag(CACHE_TAGS.BRIEF(id)),

  /**
   * Revalidate user's briefs
   */
  userBriefs: (userId: string) => revalidateTag(CACHE_TAGS.USER_BRIEFS(userId)),

  /**
   * Revalidate saved briefs
   */
  savedBriefs: (userId: string) => revalidateTag(CACHE_TAGS.SAVED_BRIEFS(userId)),

  /**
   * Revalidate all users
   */
  allUsers: () => revalidateTag(CACHE_TAGS.USERS),

  /**
   * Revalidate a specific user
   */
  user: (id: string) => revalidateTag(CACHE_TAGS.USER(id)),

  /**
   * Revalidate categories
   */
  categories: () => revalidateTag(CACHE_TAGS.CATEGORIES),

  /**
   * Revalidate stats
   */
  stats: () => revalidateTag(CACHE_TAGS.STATS),

  /**
   * Revalidate search results
   */
  search: () => revalidateTag(CACHE_TAGS.SEARCH),

  /**
   * Revalidate trending briefs
   */
  trending: () => revalidateTag(CACHE_TAGS.TRENDING),

  /**
   * Revalidate reviews for a brief
   */
  reviews: (briefId: string) => revalidateTag(CACHE_TAGS.REVIEWS(briefId)),

  /**
   * Revalidate entire path
   */
  path: (path: string) => revalidatePath(path),
};

/**
 * Helper to manually invalidate cache on mutations
 */
export function invalidateBriefCache(briefId: string) {
  revalidate.brief(briefId);
  revalidate.allBriefs();
  revalidate.trending();
}

export function invalidateUserCache(userId: string) {
  revalidate.user(userId);
  revalidate.userBriefs(userId);
  revalidate.allUsers();
}

/**
 * Wrapper for fetch with automatic caching
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit & {
    tags?: string[];
    revalidate?: number;
  }
) {
  const { tags = [], revalidate: revalidateTime, ...fetchOptions } = options || {};

  return fetch(url, {
    ...fetchOptions,
    next: {
      tags,
      revalidate: revalidateTime,
    },
  });
}

