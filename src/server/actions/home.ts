'use server';

import { db } from "@/server/db";
import type { Brief, Category, Source, BriefUpvote, Review, ResearchAIModel, User } from "@prisma/client";

// Define the Brief type with all relations
type BriefWithRelations = Brief & {
  categories: Category[];
  sources: Source[];
  upvotes: BriefUpvote[];
  reviews: Review[];
  model: ResearchAIModel;
  author: Pick<User, 'id' | 'name' | 'image'>;
};

// Define return types
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Get popular briefs for home page
export async function getPopularBriefs(limit = 8): Promise<ActionResult<BriefWithRelations[]>> {
  try {
    const briefs = await db.brief.findMany({
      where: {
        published: true,
        isActive: true,
        isDraft: false,
      },
      include: {
        categories: true,
        sources: true,
        upvotes: true,
        reviews: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error('[Home] Failed to fetch popular briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch popular briefs',
    };
  }
}

// Get recent briefs for home page
export async function getRecentBriefs(limit = 8): Promise<ActionResult<BriefWithRelations[]>> {
  try {
    const briefs = await db.brief.findMany({
      where: {
        published: true,
        isActive: true,
        isDraft: false,
      },
      include: {
        categories: true,
        sources: true,
        upvotes: true,
        reviews: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error('[Home] Failed to fetch recent briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch recent briefs',
    };
  }
}

// Get briefs by category for home page
export async function getBriefsByCategory(
  categoryName?: string,
  limit = 4
): Promise<ActionResult<BriefWithRelations[]>> {
  try {
    const whereClause = {
      published: true,
      isActive: true,
      isDraft: false,
      ...(categoryName && {
        categories: {
          some: {
            name: {
              contains: categoryName,
            },
          },
        },
      }),
    };

    const briefs = await db.brief.findMany({
      where: whereClause,
      include: {
        categories: true,
        sources: true,
        upvotes: true,
        reviews: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error(`[Home] Failed to fetch briefs by category "${categoryName}":`, error);
    return {
      success: false,
      error: 'Failed to fetch briefs by category',
    };
  }
}

// Define stats type
type BriefStats = {
  briefCount: number;
  modelCount: number;
  userCount: number;
};

// Get brief statistics for home page
export async function getBriefStats(): Promise<ActionResult<BriefStats>> {
  try {
    const [briefCount, modelCount, userCount] = await Promise.all([
      db.brief.count({
        where: {
          published: true,
          isActive: true,
          isDraft: false,
        },
      }),
      db.researchAIModel.count(),
      db.user.count(),
    ]);

    return {
      success: true,
      data: {
        briefCount,
        modelCount,
        userCount,
      },
    };
  } catch (error) {
    console.error('[Home] Failed to fetch statistics:', error);
    return {
      success: false,
      error: 'Failed to fetch statistics',
    };
  }
}

// Define category with count type
type CategoryWithCount = Category & {
  _count: {
    briefs: number;
  };
};

// Get featured categories with brief counts
export async function getFeaturedCategories(): Promise<ActionResult<CategoryWithCount[]>> {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: {
            briefs: {
              where: {
                published: true,
                isActive: true,
                isDraft: false,
              },
            },
          },
        },
      },
      orderBy: {
        briefs: {
          _count: 'desc',
        },
      },
      take: 6,
    });

    return {
      success: true,
      data: categories as CategoryWithCount[],
    };
  } catch (error) {
    console.error('[Home] Failed to fetch featured categories:', error);
    return {
      success: false,
      error: 'Failed to fetch featured categories',
    };
  }
}

// Export types for use in components
export type { BriefWithRelations, BriefStats, CategoryWithCount, ActionResult };