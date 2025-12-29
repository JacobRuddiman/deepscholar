'use server';

import { prisma } from '@/lib/prisma';
import {
  createBriefCache,
  createBriefListCache,
  createSearchCache,
  CACHE_DURATIONS,
  CACHE_TAGS,
} from '@/lib/cache';
import { getUserId } from './utils';

/**
 * Cached brief operations
 * These wrap database queries with Next.js unstable_cache for server-side caching
 */

/**
 * Get a brief by ID (cached)
 */
export const getCachedBriefById = createBriefCache(
  async (briefId: string) => {
    try {
      const brief = await prisma.brief.findUnique({
        where: { id: briefId },
        include: {
          categories: true,
          sources: true,
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              upvotes: {
                select: { userId: true },
              },
              helpfulMarks: {
                select: { userId: true },
              },
            },
            orderBy: {
              createdAt: 'desc' as const,
            },
          },
          aiReviews: {
            include: {
              model: true,
            },
          },
          savedBy: {
            select: { userId: true },
          },
          model: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          references: {
            include: {
              source: true,
            },
          },
        },
      });

      if (!brief) {
        throw new Error('Brief not found');
      }

      return brief;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached brief:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.BRIEF
);

/**
 * Get brief by slug (cached, for public viewing)
 */
export const getCachedBriefBySlug = createBriefCache(
  async (slug: string) => {
    try {
      const brief = await prisma.brief.findFirst({
        where: {
          slug,
          public: true,
        },
        include: {
          categories: true,
          sources: true,
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              upvotes: {
                select: { userId: true },
              },
              helpfulMarks: {
                select: { userId: true },
              },
            },
            orderBy: {
              createdAt: 'desc' as const,
            },
          },
          aiReviews: {
            include: {
              model: true,
            },
          },
          model: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          references: {
            include: {
              source: true,
            },
          },
        },
      });

      if (!brief) {
        throw new Error('Brief not found');
      }

      return brief;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached brief by slug:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.BRIEF
);

/**
 * Get all public briefs (cached list)
 */
export const getCachedPublicBriefs = createBriefListCache(
  async (options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    sortBy?: 'recent' | 'popular' | 'trending';
  }) => {
    const { limit = 20, offset = 0, categoryId, sortBy = 'recent' } = options || {};

    try {
      const where: any = { public: true };

      if (categoryId) {
        where.categories = {
          some: {
            id: categoryId,
          },
        };
      }

      let orderBy: any = { createdAt: 'desc' };

      if (sortBy === 'popular') {
        orderBy = { upvotes: { _count: 'desc' } };
      } else if (sortBy === 'trending') {
        // Trending: recent + popular
        // This is a simplified version - in production you'd use a more sophisticated algorithm
        orderBy = [{ upvotes: { _count: 'desc' } }, { createdAt: 'desc' }];
      }

      const briefs = await prisma.brief.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          categories: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            select: { id: true },
          },
          savedBy: {
            select: { userId: true },
          },
        },
      });

      return briefs;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached public briefs:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.BRIEF_LIST
);

/**
 * Get user's briefs (cached)
 */
export const getCachedUserBriefs = createBriefListCache(
  async (userId: string, options?: { limit?: number; offset?: number }) => {
    const { limit = 20, offset = 0 } = options || {};

    try {
      const briefs = await prisma.brief.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          categories: true,
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            select: { id: true },
          },
          savedBy: {
            select: { userId: true },
          },
        },
      });

      return briefs;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached user briefs:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.BRIEF_LIST
);

/**
 * Get saved briefs for a user (cached)
 */
export const getCachedSavedBriefs = createBriefListCache(
  async (userId: string, options?: { limit?: number; offset?: number }) => {
    const { limit = 20, offset = 0 } = options || {};

    try {
      const savedBriefs = await prisma.savedBrief.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          brief: {
            include: {
              categories: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              model: {
                select: {
                  id: true,
                  name: true,
                },
              },
              upvotes: {
                select: { userId: true },
              },
              reviews: {
                select: { id: true },
              },
            },
          },
        },
      });

      return savedBriefs.map((sb) => sb.brief);
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached saved briefs:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.BRIEF_LIST
);

/**
 * Search briefs (cached)
 */
export const getCachedSearchResults = createSearchCache(
  async (query: string, options?: { limit?: number; categoryId?: string }) => {
    const { limit = 20, categoryId } = options || {};

    try {
      const where: any = {
        public: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { abstract: { contains: query, mode: 'insensitive' } },
          { response: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (categoryId) {
        where.categories = {
          some: {
            id: categoryId,
          },
        };
      }

      const briefs = await prisma.brief.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            select: { id: true },
          },
        },
      });

      return briefs;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached search results:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.SEARCH_RESULTS
);

/**
 * Get trending briefs (cached)
 */
export const getCachedTrendingBriefs = createBriefListCache(
  async (limit: number = 10) => {
    try {
      // Trending algorithm: upvotes in last 7 days + recency
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const briefs = await prisma.brief.findMany({
        where: {
          public: true,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        take: limit,
        orderBy: [
          { upvotes: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
        include: {
          categories: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          model: {
            select: {
              id: true,
              name: true,
            },
          },
          upvotes: {
            select: { userId: true },
          },
          reviews: {
            select: { id: true },
          },
        },
      });

      return briefs;
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached trending briefs:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.TRENDING
);

/**
 * Get brief statistics (cached)
 */
export const getCachedBriefStats = createBriefCache(
  async (briefId: string) => {
    try {
      const stats = await prisma.brief.findUnique({
        where: { id: briefId },
        select: {
          _count: {
            select: {
              upvotes: true,
              reviews: true,
              savedBy: true,
              references: true,
            },
          },
          viewCount: true,
        },
      });

      if (!stats) {
        throw new Error('Brief not found');
      }

      return {
        upvotes: stats._count.upvotes,
        reviews: stats._count.reviews,
        saves: stats._count.savedBy,
        references: stats._count.references,
        views: stats.viewCount || 0,
      };
    } catch (error) {
      console.error('[Briefs] Failed to fetch cached brief stats:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.STATS
);
