'use server';

import { db } from "@/server/db";

// Get top contributors based on various metrics
export async function getTopContributors({
  page = 1,
  limit = 12,
  sortBy = 'briefs',
  search = ''
}: {
  page?: number;
  limit?: number;
  sortBy?: 'briefs' | 'rating' | 'views' | 'recent';
  search?: string;
} = {}) {
  try {
    console.log('Fetching top contributors with filters:', { page, limit, sortBy, search });
    
    const whereClause = {
      ...(search && {
        name: {
          contains: search,

        }
      }),
      briefs: {
        some: {
          published: true
        }
      }
    };

    // Get users with their brief data for calculations
    const users = await db.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            briefs: {
              where: { 
                published: true,
                isActive: true,
                isDraft: false,
              }
            },
            reviews: true,
            briefUpvotes: true,
          },
        },
        briefs: {
          where: { 
            published: true,
            isActive: true,
            isDraft: false,
          },
          include: {
            reviews: {
              select: {
                rating: true
              }
            }
          },
          orderBy: {
            viewCount: 'desc'
          },
          take: 1 // Get top brief for display
        }
      },
    });

    // Calculate metrics for each user
    const usersWithMetrics = users.map(user => {
      const totalViews = user.briefs.reduce((sum, brief) => sum + (brief.viewCount ?? 0), 0);
      const allRatings = user.briefs.flatMap(brief => brief.reviews.map(review => review.rating));
      const averageRating = allRatings.length > 0 
        ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
        : 0;

      return {
        ...user,
        totalViews,
        averageRating,
        briefs: user.briefs.map(brief => ({
          id: brief.id,
          slug: brief.slug,
          title: brief.title,
          viewCount: brief.viewCount ?? 0,
          reviews: brief.reviews
        }))
      };
    });

    // Sort based on criteria
    let sortedUsers;
    switch (sortBy) {
      case 'rating':
        sortedUsers = usersWithMetrics.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'views':
        sortedUsers = usersWithMetrics.sort((a, b) => b.totalViews - a.totalViews);
        break;
      case 'recent':
        sortedUsers = usersWithMetrics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'briefs':
      default:
        sortedUsers = usersWithMetrics.sort((a, b) => b._count.briefs - a._count.briefs);
        break;
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + limit);
    const total = sortedUsers.length;
    const totalPages = Math.ceil(total / limit);

    console.log(`Found ${paginatedUsers.length} contributors out of ${total} total`);

    return {
      success: true,
      data: paginatedUsers,
      total,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    return {
      success: false,
      error: 'Failed to fetch top contributors',
      data: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0
    };
  }
}

// Get all user briefs for activity feed (including all versions)
export async function getUserActivityBriefs(userId: string) {
  try {
    const allBriefs = await db.brief.findMany({
      where: {
        userId: userId,
        published: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        versionNumber: true,
        isDraft: true,
        changeLog: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: allBriefs,
    };
  } catch (error) {
    console.error('Error fetching user activity briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch activity briefs',
      data: [],
    };
  }
}

// Get user profile data
export async function getUserProfile(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        briefs: {
          where: {
            published: true,
            isActive: true,
            isDraft: false,
          },
          include: {
            categories: true,
            model: true,
            upvotes: true,
            reviews: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        reviews: {
          include: {
            brief: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        briefUpvotes: {
          include: {
            brief: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            briefs: true,
            reviews: true,
            briefUpvotes: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Calculate upvotes received on user's briefs
    const upvotesReceived = user.briefs.reduce((acc, brief) => acc + brief.upvotes.length, 0);

    const averageScore = await db.review.aggregate({
      where: { userId: user.id },
      _avg: { rating: true },
    });

    return {
      success: true,
      data: {
        ...user,
        upvotesReceived,
        averageScore: averageScore._avg.rating ?? 0,
      },
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: 'Failed to fetch user profile',
    };
  }
}
