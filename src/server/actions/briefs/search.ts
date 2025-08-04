'use server';

import { prisma } from '@/lib/prisma';

// Search briefs with comprehensive filtering
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
}: {
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
}) {
  try {
    console.log('searchBriefs called with params:', {
      query, categories, model, sortBy, dateRange, rating, page, limit
    });

    // Build where clause for filtering
    const whereClause: any = {
      published: true,
      isActive: true, // Only show active versions
      isDraft: false, // Exclude drafts
    };

    // Text search in title, abstract, and content with typo correction
    let correctionInfo = null;
    if (query && query.trim()) {
      const { getSearchVariations, correctSearchQuery } = await import('@/lib/spellcheck');
      const searchVariations = getSearchVariations(query.trim());
      const correction = correctSearchQuery(query.trim());
      
      console.log('Search variations (including typo corrections):', searchVariations);
      
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

    console.log('Executing search with where clause:', JSON.stringify(whereClause, null, 2));
    console.log('Order by:', JSON.stringify(orderBy, null, 2));

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
          upvotes: {
            select: {
              id: true,
            },
          },
          reviews: {
            select: {
              id: true,
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
      prisma.brief.count({
        where: whereClause,
      }),
    ]);

    console.log(`Found ${briefs.length} briefs out of ${totalCount} total`);

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
      .map(brief => {
        // Calculate average rating
        const avgRating = brief.reviews.length > 0
          ? brief.reviews.reduce((sum, review) => sum + review.rating, 0) / brief.reviews.length
          : undefined;

        // Estimate read time (rough calculation: 200 words per minute)
        const wordCount = brief.response ? brief.response.split(' ').length : 0;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        return {
          id: brief.id,
          title: brief.title,
          abstract: brief.abstract || '',
          model: brief.model.name,
          date: brief.createdAt.toLocaleDateString(),
          readTime: `${readTimeMinutes} min read`,
          category: brief.categories.length > 0 ? brief.categories[0]!.name : 'Uncategorized',
          views: 0, // TODO: Implement view tracking
          rating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
          reviewCount: brief.reviews.length,
        };
      });

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
    console.error('Error searching briefs:', error);
    return {
      success: false,
      error: 'Failed to search briefs',
    };
  }
}