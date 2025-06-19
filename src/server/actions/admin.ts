'use server';

import { db } from "@/server/db";

// Get dashboard statistics
export async function getAdminStats() {
  try {
    const [
      totalUsers,
      totalBriefs,
      totalReviews,
      totalAIReviews,
      totalModels,
      recentUsers,
      recentBriefs,
      recentReviews
    ] = await Promise.all([
      db.user.count(),
      db.brief.count(),
      db.review.count(),
      db.aIReview.count(),
      db.researchAIModel.count(),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      db.brief.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true, author: { select: { name: true } } }
      }),
      db.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, rating: true, createdAt: true, author: { select: { name: true } }, brief: { select: { title: true } } }
      })
    ]);

    const recentActivity = [
      ...recentUsers.map(user => ({
        type: 'user' as const,
        action: `New user registered: ${user.name || user.email || 'Anonymous'}`,
        time: user.createdAt.toISOString(),
        id: user.id
      })),
      ...recentBriefs.map(brief => ({
        type: 'brief' as const,
        action: `New brief published: ${brief.title}`,
        time: brief.createdAt.toISOString(),
        id: brief.id
      })),
      ...recentReviews.map(review => ({
        type: 'review' as const,
        action: `Review submitted for: ${review.brief.title}`,
        time: review.createdAt.toISOString(),
        id: review.id
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    return {
      success: true,
      data: {
        totalUsers,
        totalBriefs,
        totalReviews,
        totalAIReviews,
        totalModels,
        recentActivity
      }
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      success: false,
      error: 'Failed to fetch admin statistics'
    };
  }
}

// Get all users with pagination and filtering
export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'admin' | 'user';
  sortBy?: 'name' | 'email' | 'created' | 'briefs' | 'reviews' | 'tokens';
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      sortBy = 'name'
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    // Role filter
    if (filter === 'admin') {
      where.isAdmin = true;
    } else if (filter === 'user') {
      where.isAdmin = false;
    }

    // Sort configuration
    let orderBy: any;
    switch (sortBy) {
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'email':
        orderBy = { email: 'asc' };
        break;
      case 'created':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          _count: {
            select: {
              briefs: true,
              reviews: true
            }
          },
          tokenBalance: true
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.user.count({ where })
    ]);

    return {
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt.toISOString(),
          lastInteractionDate: user.lastInteractionDate?.toISOString(),
          briefCount: user._count.briefs,
          reviewCount: user._count.reviews,
          tokenBalance: user.tokenBalance?.balance || 0
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return {
      success: false,
      error: 'Failed to fetch users'
    };
  }
}

// Get all briefs with pagination and filtering
export async function getAdminBriefs(params: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'published' | 'draft';
  sortBy?: 'title' | 'author' | 'created' | 'views' | 'rating';
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      sortBy = 'created'
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { abstract: { contains: search } },
        { author: { name: { contains: search } } }
      ];
    }

    // Status filter
    if (filter === 'published') {
      where.published = true;
    } else if (filter === 'draft') {
      where.published = false;
    }

    // Sort configuration
    let orderBy: any;
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'author':
        orderBy = { author: { name: 'asc' } };
        break;
      case 'views':
        orderBy = { viewCount: 'desc' };
        break;
      case 'created':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [briefs, totalCount] = await Promise.all([
      db.brief.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          model: {
            select: { name: true, provider: true }
          },
          categories: {
            select: { name: true }
          },
          _count: {
            select: {
              reviews: true,
              upvotes: true
            }
          },
          reviews: {
            select: { rating: true }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.brief.count({ where })
    ]);

    return {
      success: true,
      data: {
        briefs: briefs.map(brief => {
          const avgRating = brief.reviews.length > 0 
            ? brief.reviews.reduce((sum, r) => sum + r.rating, 0) / brief.reviews.length 
            : null;

          return {
            id: brief.id,
            title: brief.title,
            abstract: brief.abstract,
            author: brief.author,
            model: brief.model,
            categories: brief.categories,
            published: brief.published,
            viewCount: brief.viewCount,
            reviewCount: brief._count.reviews,
            upvoteCount: brief._count.upvotes,
            averageRating: avgRating,
            createdAt: brief.createdAt.toISOString(),
            updatedAt: brief.updatedAt.toISOString()
          };
        }),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    };
  } catch (error) {
    console.error('Error fetching admin briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch briefs'
    };
  }
}

// Get all AI reviews with pagination and filtering
export async function getAdminAIReviews(params: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'all' | '5star' | '4star' | '3star' | '2star' | '1star';
  sortBy?: 'created' | 'rating' | 'model' | 'brief';
}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      sortBy = 'created'
    } = params;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { model: { name: { contains: search } } },
        { brief: { title: { contains: search } } }
      ];
    }

    // Rating filter
    if (filter !== 'all') {
      const rating = parseInt(filter.charAt(0));
      where.rating = rating;
    }

    // Sort configuration
    let orderBy: any;
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'model':
        orderBy = { model: { name: 'asc' } };
        break;
      case 'brief':
        orderBy = { brief: { title: 'asc' } };
        break;
      case 'created':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [aiReviews, totalCount] = await Promise.all([
      db.aIReview.findMany({
        where,
        include: {
          model: {
            select: { id: true, name: true, provider: true }
          },
          brief: {
            select: { id: true, title: true }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      db.aIReview.count({ where })
    ]);

    return {
      success: true,
      data: {
        aiReviews: aiReviews.map(review => ({
          id: review.id,
          content: review.content,
          rating: review.rating,
          model: review.model,
          brief: review.brief,
          helpfulCount: review.helpfulCount,
          createdAt: review.createdAt.toISOString()
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    };
  } catch (error) {
    console.error('Error fetching admin AI reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch AI reviews'
    };
  }
}


// Helper function to get admin user ID with LOCAL mode support
async function getAdminUserId() {
  const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
  
  if (isLocalMode) {
    return 'local-user-1'; // Assume local user is admin
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }
    
    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });
    
    if (!user?.isAdmin) {
      throw new Error('Not authorized - admin access required');
    }
    
    return session.user.id;
  }
}

// Get all reviews for admin
export async function getAdminReviews({
  page = 1,
  limit = 50,
  search = '',
  filter = 'all',
  sortBy = 'created'
}: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  sortBy?: string;
} = {}) {
  try {
    console.log('Starting getAdminReviews');
    
    await getAdminUserId(); // Verify admin access
    console.log('Admin access verified');

    // Build where clause based on filters
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          author: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          brief: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Apply additional filters
    if (filter === 'high-rated') {
      whereClause.rating = { gte: 4 };
    } else if (filter === 'low-rated') {
      whereClause.rating = { lte: 2 };
    } else if (filter === 'recent') {
      whereClause.createdAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'author') {
      orderBy = { author: { name: 'asc' } };
    } else if (sortBy === 'brief') {
      orderBy = { brief: { title: 'asc' } };
    }

    console.log('Querying database for reviews');
    const reviews = await db.review.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        brief: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        upvotes: {
          select: {
            id: true,
            userId: true,
          },
        },
        helpfulMarks: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.review.count({
      where: whereClause,
    });

    console.log(`Found ${reviews.length} reviews`);

    return {
      success: true,
      data: {
        reviews,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews',
    };
  }
}
// Get all models for admin management
export async function getAdminModels({
  page = 1,
  limit = 10,
  search = '',
  filter = 'all',
  sortBy = 'created'
}: {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  sortBy?: string;
} = {}) {
  try {
    console.log('Starting getAdminModels');
    
    // Check if user is admin
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return {
        success: false,
        error: 'Not authorized',
      };
    }

    console.log('Querying database for models');
    const models = await db.researchAIModel.findMany({
      include: {
        _count: {
          select: {
            briefs: true,
          },
        },
        briefs: {
          select: {
            id: true,
            title: true,
            viewCount: true,
            upvoteCount: true,
            averageRating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${models.length} models`);

    return {
      success: true,
      data: {
        models,
        total: models.length,
        page,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching admin models:', error);
    return {
      success: false,
      error: 'Failed to fetch models',
    };
  }
}