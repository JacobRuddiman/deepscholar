'use server';

import { prisma } from "@/lib/prisma";

// Get all briefs with filtering and sorting
export async function getBriefs({
  page = 1,
  limit = 12,
  sortBy = 'popular',
  categories = [],
  search = '',
  modelFilter = ''
}: {
  page?: number;
  limit?: number;
  sortBy?: 'popular' | 'new' | 'controversial';
  categories?: string[];
  search?: string;
  modelFilter?: string;
} = {}) {
  try {
    console.log('Fetching briefs with filters:', { page, limit, sortBy, categories, search, modelFilter });
    
    const whereClause = {
      published: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { abstract: { contains: search, mode: 'insensitive' as const } },
          { response: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(categories.length > 0 && {
        categories: {
          some: {
            name: {
              in: categories,
              mode: 'insensitive' as const
            }
          }
        }
      }),
      ...(modelFilter && {
        model: {
          name: {
            contains: modelFilter,
            mode: 'insensitive' as const
          }
        }
      })
    };

    // Define sort order
    let orderBy: any;
    switch (sortBy) {
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'controversial':
        // For controversial, we'll use a combination of high view count but low average rating
        // This is a simplified approach - you might want to implement a more sophisticated algorithm
        orderBy = [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'popular':
      default:
        orderBy = [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
    }

    const [briefs, total] = await Promise.all([
      prisma.brief.findMany({
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.brief.count({ where: whereClause })
    ]);

    console.log(`Found ${briefs.length} briefs out of ${total} total`);

    return {
      success: true,
      data: briefs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch briefs',
      data: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0
    };
  }
}

// Get all categories for filtering
export async function getAllCategories() {
  try {
    console.log('Fetching all categories');
    
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            briefs: {
              where: {
                published: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Found ${categories.length} categories`);

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: 'Failed to fetch categories',
    };
  }
}

// Get all models for filtering
export async function getAllModels() {
  try {
    console.log('Fetching all models');
    
    const models = await prisma.researchAIModel.findMany({
      include: {
        _count: {
          select: {
            briefs: {
              where: {
                published: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Found ${models.length} models`);

    return {
      success: true,
      data: models,
    };
  } catch (error) {
    console.error('Error fetching models:', error);
    return {
      success: false,
      error: 'Failed to fetch models',
    };
  }
}
