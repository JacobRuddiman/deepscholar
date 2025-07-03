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
    console.log('Fetching popular briefs with limit:', limit);
    
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

    console.log(`Found ${briefs.length} popular briefs`);

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error('Error fetching popular briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch popular briefs',
    };
  }
}

// Get recent briefs for home page
export async function getRecentBriefs(limit = 8): Promise<ActionResult<BriefWithRelations[]>> {
  try {
    console.log('Fetching recent briefs with limit:', limit);
    
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

    console.log(`Found ${briefs.length} recent briefs`);

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error('Error fetching recent briefs:', error);
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
    console.log('Fetching briefs by category:', categoryName, 'with limit:', limit);
    
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

    console.log(`Found ${briefs.length} briefs for category: ${categoryName ?? 'all'}`);

    return {
      success: true,
      data: briefs as BriefWithRelations[],
    };
  } catch (error) {
    console.error('Error fetching briefs by category:', error);
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
    console.log('Fetching brief statistics');
    
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

    console.log('Statistics:', { briefCount, modelCount, userCount });

    return {
      success: true,
      data: {
        briefCount,
        modelCount,
        userCount,
      },
    };
  } catch (error) {
    console.error('Error fetching brief statistics:', error);
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
    console.log('Fetching featured categories');
    
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

    console.log(`Found ${categories.length} featured categories`);

    return {
      success: true,
      data: categories as CategoryWithCount[],
    };
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    return {
      success: false,
      error: 'Failed to fetch featured categories',
    };
  }
}

// Export types for use in components
export type { BriefWithRelations, BriefStats, CategoryWithCount, ActionResult };