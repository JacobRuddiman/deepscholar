'use server';

import { prisma } from '@/lib/prisma';

interface SearchParams {
  query?: string;
  categories?: string[];
  model?: string;
  sortBy?: 'popular' | 'new' | 'controversial';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  rating?: 'all' | '4+' | '3+' | '2+';
  readingTime?: 'all' | 'short' | 'medium' | 'long';
  searchFullContent?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Search briefs with comprehensive filtering
 */
export async function searchBriefs({
  query,
  categories,
  model,
  sortBy = 'popular',
  dateRange = 'all',
  rating = 'all',
  readingTime = 'all',
  searchFullContent = false,
  page = 1,
  limit = 20
}: SearchParams) {
  try {

    // Build where clause for filtering
    const whereClause: any = {
      published: true,
      isActive: true, // Only show active versions
      isDraft: false, // Exclude drafts
    };

    // Text search in title, abstract, and content with typo correction
    let correctionInfo = null;
    if (query?.trim()) {
      const { getSearchVariations, correctSearchQuery } = await import('@/lib/spellcheck');
      const searchVariations = getSearchVariations(query.trim());
      const correction = correctSearchQuery(query.trim());

      // Store correction info for the response
      if (correction.correctedQuery && correction.corrections.length > 0) {
        correctionInfo = {
          originalQuery: correction.originalQuery,
          correctedQuery: correction.correctedQuery,
          corrections: correction.corrections
        };
      }
      
      // Create OR conditions for each search variation based on search scope
      const searchConditions = [];
      for (const variation of searchVariations) {
        // Always search titles
        searchConditions.push({
          title: {
            contains: variation,
          },
        });
        
        // Only search abstracts and responses if searchFullContent is true
        if (searchFullContent) {
          searchConditions.push(
            {
              abstract: {
                contains: variation,
              },
            },
            {
              response: {
                contains: variation,
              },
            }
          );
        }
      }
      
      whereClause.OR = searchConditions;
    }

    // Category filtering
    if (categories && categories.length > 0) {
      whereClause.categories = {
        some: {
          name: {
            in: categories,
          },
        },
      };
    }

    // Model filtering
    if (model && model !== 'All Models') {
      whereClause.model = {
        name: {
          contains: model.toLowerCase(),
        },
      };
    }

    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      whereClause.createdAt = {
        gte: startDate,
      };
    }

    // Build orderBy clause for sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'controversial':
        // Sort by review count descending (more reviews = more controversial)
        orderBy = { reviews: { _count: 'desc' } };
        break;
      case 'popular':
      default:
        // Sort by upvotes count descending
        orderBy = { upvotes: { _count: 'desc' } };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute the search query
    const [briefs, totalCount] = await Promise.all([
      prisma.brief.findMany({
        where: whereClause,
        include: {
          categories: {
            select: {
              name: true,
            },
          },
          model: {
            select: {
              name: true,
              provider: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.brief.count({ where: whereClause }),
    ]);

    // Transform results to match the expected SearchResult interface
    const results = briefs
      .filter(brief => {
        // Apply rating filter after fetching (since it requires calculation)
        if (rating !== 'all') {
          const avgRating = brief.reviews.length > 0
            ? brief.reviews.reduce((sum, review) => sum + review.rating, 0) / brief.reviews.length
            : 0;

          const minRating = parseFloat(rating.replace('+', ''));
          if (avgRating < minRating) {
            return false;
          }
        }

        // Apply reading time filter after fetching (since it requires calculation)
        if (readingTime !== 'all') {
          const wordCount = brief.response ? brief.response.split(' ').length : 0;
          const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

          switch (readingTime) {
            case 'short':
              if (readTimeMinutes >= 5) return false;
              break;
            case 'medium':
              if (readTimeMinutes < 5 || readTimeMinutes > 15) return false;
              break;
            case 'long':
              if (readTimeMinutes <= 15) return false;
              break;
          }
        }

        return true;
      })
      .map(brief => ({
        id: brief.id,
        title: brief.title,
        abstract: brief.abstract || '',
        model: brief.model.name,
        date: brief.createdAt.toLocaleDateString(),
        readTime: `${calculateReadTime(brief.response)} min read`,
        category: brief.categories[0]?.name || 'Uncategorized',
        views: brief.viewCount,
        rating: calculateAverageRating(brief.reviews),
        reviewCount: brief._count.reviews,
      }));

    // Adjust total count if rating filter was applied
    const filteredTotalCount = rating !== 'all' ? results.length : totalCount;

    return {
      success: true,
      data: {
        results,
        totalCount: filteredTotalCount,
        page,
        limit,
        totalPages: Math.ceil(filteredTotalCount / limit),
        correctionInfo, // Include correction info in the response
      },
    };
  } catch (error) {
    console.error('[Briefs] Failed to search briefs:', error);
    return {
      success: false,
      error: 'Failed to search briefs',
    };
  }
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: { rating: number }[]): number | undefined {
  if (reviews.length === 0) return undefined;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Calculate estimated read time in minutes
 * @param content - The content to calculate read time for
 * @param wordsPerMinute - Reading speed (default: 200 wpm)
 */
function calculateReadTime(content: string | null, wordsPerMinute = 200): number {
  if (!content) return 1;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}