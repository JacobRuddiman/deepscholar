'use server';

import { prisma } from '@/lib/prisma';
import {
  createUserCache,
  createCachedFunction,
  CACHE_DURATIONS,
  CACHE_TAGS,
} from '@/lib/cache';

/**
 * Cached user queries
 */

/**
 * Get user by ID (cached)
 */
export const getCachedUserById = createUserCache(
  async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              briefs: true,
              reviews: true,
              savedBriefs: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('[Users] Failed to fetch cached user:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.USER
);

/**
 * Get user profile with stats (cached)
 */
export const getCachedUserProfile = createUserCache(
  async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          briefs: {
            where: { published: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              abstract: true,
              slug: true,
              createdAt: true,
              categories: true,
              _count: {
                select: {
                  upvotes: true,
                  reviews: true,
                },
              },
            },
          },
          _count: {
            select: {
              briefs: true,
              reviews: true,
              savedBriefs: true,
              briefUpvotes: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('[Users] Failed to fetch cached user profile:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.USER_PROFILE
);

/**
 * Cached category queries
 */

/**
 * Get all categories (cached)
 */
export const getCachedCategories = createCachedFunction(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              briefs: true,
            },
          },
        },
      });

      return categories;
    } catch (error) {
      console.error('[Categories] Failed to fetch cached categories:', error);
      throw error;
    }
  },
  {
    tags: [CACHE_TAGS.CATEGORIES],
    revalidate: CACHE_DURATIONS.CATEGORIES,
    keyPrefix: 'categories',
  }
);

/**
 * Get category by ID (cached)
 */
export const getCachedCategoryById = createCachedFunction(
  async (categoryId: string) => {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              briefs: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      console.error('[Categories] Failed to fetch cached category:', error);
      throw error;
    }
  },
  {
    tags: [CACHE_TAGS.CATEGORIES],
    revalidate: CACHE_DURATIONS.CATEGORIES,
    keyPrefix: 'category',
  }
);

/**
 * Cached platform statistics
 */

/**
 * Get platform stats (cached)
 */
export const getCachedPlatformStats = createCachedFunction(
  async () => {
    try {
      const [briefCount, userCount, reviewCount, categoryCount] = await Promise.all([
        prisma.brief.count({ where: { published: true } }),
        prisma.user.count(),
        prisma.review.count(),
        prisma.category.count(),
      ]);

      // Get recent activity
      const recentBriefs = await prisma.brief.findMany({
        where: { published: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      return {
        totalBriefs: briefCount,
        totalUsers: userCount,
        totalReviews: reviewCount,
        totalCategories: categoryCount,
        recentBriefs,
      };
    } catch (error) {
      console.error('[Stats] Failed to fetch cached platform stats:', error);
      throw error;
    }
  },
  {
    tags: [CACHE_TAGS.STATS],
    revalidate: CACHE_DURATIONS.STATS,
    keyPrefix: 'platform-stats',
  }
);

/**
 * Get user statistics (cached)
 */
export const getCachedUserStats = createUserCache(
  async (userId: string) => {
    try {
      const stats = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              briefs: true,
              reviews: true,
              savedBriefs: true,
              briefUpvotes: true,
              reviewUpvotes: true,
              reviewHelpful: true,
            },
          },
        },
      });

      if (!stats) {
        throw new Error('User not found');
      }

      // Calculate total upvotes received on user's briefs
      const upvotesReceived = await prisma.briefUpvote.count({
        where: {
          brief: {
            userId,
          },
        },
      });

      return {
        briefsCreated: stats._count.briefs,
        reviewsWritten: stats._count.reviews,
        briefsSaved: stats._count.savedBriefs,
        briefsUpvoted: stats._count.briefUpvotes,
        reviewsUpvoted: stats._count.reviewUpvotes,
        helpfulReviewsMarked: stats._count.reviewHelpful,
        upvotesReceived,
      };
    } catch (error) {
      console.error('[Stats] Failed to fetch cached user stats:', error);
      throw error;
    }
  },
  CACHE_DURATIONS.STATS
);

/**
 * Cached model queries
 */

/**
 * Get all AI models (cached)
 */
export const getCachedModels = createCachedFunction(
  async () => {
    try {
      const models = await prisma.researchAIModel.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              briefs: true,
            },
          },
        },
      });

      return models;
    } catch (error) {
      console.error('[Models] Failed to fetch cached models:', error);
      throw error;
    }
  },
  {
    tags: ['models'],
    revalidate: CACHE_DURATIONS.CATEGORIES, // Models change infrequently
    keyPrefix: 'models',
  }
);

/**
 * Get model by ID (cached)
 */
export const getCachedModelById = createCachedFunction(
  async (modelId: string) => {
    try {
      const model = await prisma.researchAIModel.findUnique({
        where: { id: modelId },
        include: {
          _count: {
            select: {
              briefs: true,
            },
          },
        },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      return model;
    } catch (error) {
      console.error('[Models] Failed to fetch cached model:', error);
      throw error;
    }
  },
  {
    tags: ['models'],
    revalidate: CACHE_DURATIONS.CATEGORIES,
    keyPrefix: 'model',
  }
);
