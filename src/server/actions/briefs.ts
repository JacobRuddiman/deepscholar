'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { validateInput, createBriefSchema, updateBriefSchema, createReviewSchema, sanitizeHtml, sanitizeText } from '@/lib/validation';

// Types for brief operations
type CreateBriefInput = {
  title: string;
  abstract?: string | null;
  prompt: string;
  response: string;
  thinking?: string;
  categoryIds?: string[];
  sourceIds?: string[];
  modelId: string;
  slug?: string;
};

type UpdateBriefInput = {
  title?: string;
  abstract?: string | null;
  prompt?: string;
  response?: string;
  thinking?: string;
  categoryIds?: string[];
  sourceIds?: string[];
  modelId?: string;
  published?: boolean;
};

// Helper function to get user ID with LOCAL mode support
async function getUserId() {
  const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
  
  if (isLocalMode) {
    return 'local-user-1';
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }
    return session.user.id;
  }
}

// Get all briefs for the current user
export async function getUserBriefs() {
  try {
    console.log('Starting getUserBriefs');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    console.log('Querying database for briefs');
    const briefs = await db.brief.findMany({
      where: {
        userId,
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
          createdAt: 'desc' as const,
        },
    });
    console.log(`Found ${briefs.length} briefs`);

    return {
      success: true,
      data: briefs,
    };
  } catch (error) {
    console.error('Error fetching user briefs:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'Failed to fetch briefs',
    };
  }
}

// Get reviews written by the current user
export async function getUserReviews() {
  try {
    const userId = await getUserId();

    const reviews = await db.review.findMany({
      where: {
        userId: userId,
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: reviews,
    };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch reviews',
    };
  }
}

// Get a single brief by slug or ID
export async function getBriefBySlug(slug: string) {
  try {
    console.log('Starting getBriefBySlug with slug:', slug);
    console.log('Slug type:', typeof slug);
    console.log('Slug length:', slug.length);
    console.log('Is slug likely an ID?', slug.length > 20);
    
    const includeOptions = {
      categories: true,
      sources: true,
      upvotes: true,
      savedBy: true,
      reviews: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          upvotes: true,
          helpfulMarks: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      aiReviews: {
        include: {
          model: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
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
    };

    // First try to find by slug
    let brief = await db.brief.findUnique({
      where: {
        slug: slug,
      },
      include: includeOptions,
    });

    // If not found by slug, try by ID (for cases where slug is actually an ID)
    if (!brief) {
      console.log('Brief not found by slug, trying by ID:', slug);
      brief = await db.brief.findUnique({
        where: {
          id: slug,
        },
        include: includeOptions,
      });
      
      if (brief) {
        console.log('Brief found by ID:', { id: brief.id, slug: brief.slug, title: brief.title });
      }
    } else {
      console.log('Brief found by slug:', { id: brief.id, slug: brief.slug, title: brief.title });
    }

    if (!brief) {
      console.log('Brief not found by either slug or ID:', slug);
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    // Increment view count - use the appropriate field for the update
    try {
      if (brief.slug) {
        await db.brief.update({
          where: { slug: brief.slug },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      } else {
        await db.brief.update({
          where: { id: brief.id },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      }
    } catch (updateError) {
      console.warn('Failed to update view count:', updateError);
      // Don't fail the whole request if view count update fails
    }

    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.error('Error fetching brief by slug:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

export async function getBriefById(briefId: string) {
  try {
    console.log('Starting getBriefById');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    const brief = await db.brief.findUnique({
      where: {
        id: briefId,
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
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.error('Error fetching brief:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

// Create a new brief
export async function createBrief(input: CreateBriefInput) {
  console.log('\n==========================================');
  console.log('🚀 STARTING CREATE BRIEF OPERATION');
  console.log('==========================================\n');

  try {
    // Set default prompt if empty
    const briefData = {
      ...input,
      prompt: input.prompt ?? 'placeholder'
    };

    // Log environment and mode
    console.log('📋 ENVIRONMENT CHECK');
    console.log('------------------------------------------');
    const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
    console.log('Local mode:', isLocalMode);
    console.log('Node environment:', process.env.NODE_ENV);
    console.log('------------------------------------------\n');

    // Authentication logging
    console.log('🔐 AUTHENTICATION CHECK');
    console.log('------------------------------------------');
    
    const userId = await getUserId();
    console.log('User ID being used:', userId);
    console.log('------------------------------------------\n');

    // Token validation
    console.log('💰 TOKEN VALIDATION');
    console.log('------------------------------------------');
    const { deductTokens, getTokenCosts } = await import('./tokens');
    const TOKEN_COSTS = await getTokenCosts();
    
    const tokenResult = await deductTokens(
      TOKEN_COSTS.PUBLISH_BRIEF,
      'Brief publication',
      undefined,
      undefined
    );

    if (!tokenResult.success) {
      console.log('❌ Insufficient tokens:', tokenResult.error);
      return {
        success: false,
        error: tokenResult.error,
        insufficientTokens: true,
        requiredTokens: TOKEN_COSTS.PUBLISH_BRIEF,
        currentBalance: tokenResult.balance ?? 0,
      };
    }

    console.log('✅ Tokens deducted successfully. New balance:', tokenResult.balance);
    console.log('------------------------------------------\n');

    // Input validation logging
    console.log('📝 INPUT VALIDATION');
    console.log('------------------------------------------');
    console.log('Raw input data:', JSON.stringify(briefData, null, 2));
    
    // Validate required fields
    // BRIEF CREATION ENHANCEMENT: Remove slug requirement to prevent unique constraint errors
    // Since we're now using ID-based routing, slugs are optional and can be null
    // This prevents duplicate slug errors when multiple briefs have similar titles
    // The routing system will handle both slug and ID-based URLs automatically
    const requiredFields = ['title', 'prompt', 'response', 'modelId'];
    const missingFields = requiredFields.filter(field => !briefData[field as keyof CreateBriefInput]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate field types and lengths
    console.log('Field validations:');
    console.log('- title length:', briefData.title.length);
    console.log('- prompt length:', briefData.prompt.length);
    console.log('- response length:', briefData.response.length);
    console.log('- modelId:', briefData.modelId);
    console.log('- slug:', briefData.slug);
    console.log('- categoryIds:', briefData.categoryIds?.length ?? 0);
    console.log('- sourceIds:', briefData.sourceIds?.length ?? 0);
    console.log('------------------------------------------\n');

    // Database operation logging
    console.log('💾 DATABASE OPERATION');
    console.log('------------------------------------------');
    console.log('Attempting to create brief with data:', {
      title: briefData.title,
      abstract: briefData.abstract ? 'present' : 'absent',
      prompt: briefData.prompt ? 'present' : 'absent',
      response: briefData.response ? 'present' : 'absent',
      thinking: briefData.thinking ? 'present' : 'absent',
      slug: briefData.slug,
      modelId: briefData.modelId,
      userId: userId,
      categoryCount: briefData.categoryIds?.length ?? 0,
      sourceCount: briefData.sourceIds?.length ?? 0
    });

    // Create the brief
    const brief = await db.brief.create({
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        // BRIEF CREATION ENHANCEMENT: Make slug optional to prevent unique constraint errors
        // Only set slug if it's provided and not empty, otherwise let it be null
        // This allows multiple briefs with similar titles without slug conflicts
        ...(briefData.slug && briefData.slug.trim() ? { slug: briefData.slug } : {}),
        // Note: The routing system will handle both slug and ID-based URLs automatically
        modelId: briefData.modelId,
        userId: userId,
        ...(briefData.categoryIds && {
          categories: {
            connect: briefData.categoryIds.map((id: string) => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            connect: briefData.sourceIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
        sources: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Verify the created brief has all required data
    if (!brief) {
      throw new Error('Brief creation failed - no brief returned');
    }

    // Log the created brief for debugging
    console.log('Created brief:', {
      id: brief.id,
      title: brief.title,
      hasAuthor: !!brief.author,
      authorId: brief.author?.id ?? null,
      hasModel: !!brief.model,
      modelId: brief.model?.id ?? null,
    });

    console.log('✅ Brief created successfully');
    console.log('Created brief ID:', brief.id);
    console.log('------------------------------------------\n');

    // Cache revalidation
    console.log('🔄 CACHE REVALIDATION');
    console.log('------------------------------------------');
    revalidatePath('/briefs');
    revalidatePath('/my-briefs');
    console.log('Cache revalidated for /briefs and /my-briefs');
    console.log('------------------------------------------\n');

    console.log('✨ CREATE BRIEF OPERATION COMPLETED SUCCESSFULLY');
    console.log('==========================================\n');

    // Return a clean response object
    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.log('\n❌ ERROR IN CREATE BRIEF OPERATION');
    console.log('==========================================');
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    
    console.log('==========================================\n');

    // Ensure we always return a valid object
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create brief',
    };
  }
}

// Update an existing brief
export async function updateBrief(briefId: string, input: UpdateBriefInput) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const existingBrief = await db.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!existingBrief || existingBrief.userId !== userId) {
      throw new Error('Not authorized to update this brief');
    }

    // Update the brief
    const brief = await db.brief.update({
      where: { id: briefId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.abstract !== undefined && { abstract: input.abstract }),
        ...(input.prompt && { prompt: input.prompt }),
        ...(input.response && { response: input.response }),
        ...(input.thinking !== undefined && { thinking: input.thinking }),
        ...(input.modelId && { modelId: input.modelId }),
        ...(input.published !== undefined && { published: input.published }),
        ...(input.categoryIds && {
          categories: {
            set: input.categoryIds.map(id => ({ id })),
          },
        }),
        ...(input.sourceIds && {
          sources: {
            set: input.sourceIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
        sources: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    revalidatePath('/my-briefs');
    revalidatePath('/profile');
    revalidatePath(`/briefs/${briefId}`);

    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.error('Error updating brief:', error);
    return {
      success: false,
      error: 'Failed to update brief',
    };
  }
}

// Delete a brief
export async function deleteBrief(briefId: string) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const existingBrief = await db.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!existingBrief || existingBrief.userId !== userId) {
      throw new Error('Not authorized to delete this brief');
    }

    // Delete related records first to avoid foreign key constraint violations
    // Delete in the correct order to respect dependencies
    
    // Delete review helpful marks first (they depend on reviews)
    await db.reviewHelpful.deleteMany({
      where: {
        review: {
          briefId: briefId,
        },
      },
    });

    // Delete review upvotes (they depend on reviews)
    await db.reviewUpvote.deleteMany({
      where: {
        review: {
          briefId: briefId,
        },
      },
    });

    // Delete reviews
    await db.review.deleteMany({
      where: { briefId: briefId },
    });

    // Delete AI reviews
    await db.aIReview.deleteMany({
      where: { briefId: briefId },
    });

    // Delete brief upvotes
    await db.briefUpvote.deleteMany({
      where: { briefId: briefId },
    });

    // Delete saved briefs
    await db.savedBrief.deleteMany({
      where: { briefId: briefId },
    });


    // Delete token transactions related to this brief
    await db.tokenTransaction.deleteMany({
      where: { briefId: briefId },
    });

    // Finally, delete the brief itself
    await db.brief.delete({
      where: { id: briefId },
    });

    revalidatePath('/my-briefs');
    revalidatePath('/profile');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting brief:', error);
    return {
      success: false,
      error: 'Failed to delete brief',
    };
  }
}

// Toggle upvote on a brief
export async function toggleBriefUpvote(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if user has already upvoted
    const existingUpvote = await db.briefUpvote.findUnique({
      where: {
        briefId_userId: {
          userId: userId,
          briefId,
        },
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await db.briefUpvote.delete({
        where: {
          briefId_userId: {
            userId: userId,
            briefId,
          },
        },
      });

      // Deduct token for removing upvote
      try {
        const { deductTokens, getTokenRewards } = await import('./tokens');
        const TOKEN_REWARDS = await getTokenRewards();
        await deductTokens(
          TOKEN_REWARDS.GIVE_UPVOTE,
          'Upvote removed',
          briefId
        );
      } catch (tokenError) {
        console.warn('Failed to deduct tokens for upvote removal:', tokenError);
      }
    } else {
      // Get brief details to award tokens to the author
      const brief = await db.brief.findUnique({
        where: { id: briefId },
        select: { userId: true },
      });

      // Add upvote
      await db.briefUpvote.create({
        data: {
          userId: userId,
          briefId,
        },
      });

      // Award token for giving upvote
      try {
        const { awardTokens, getTokenRewards } = await import('./tokens');
        const TOKEN_REWARDS = await getTokenRewards();
        await awardTokens(
          TOKEN_REWARDS.GIVE_UPVOTE,
          'Upvote given',
          briefId
        );
      } catch (tokenError) {
        console.warn('Failed to award tokens for upvote:', tokenError);
      }

      // Award token to the brief author for receiving upvote
      try {
        if (brief) {
          const { awardTokens, getTokenRewards } = await import('./tokens');
          const TOKEN_REWARDS = await getTokenRewards();
          await awardTokens(
            TOKEN_REWARDS.RECEIVE_UPVOTE,
            'Received upvote',
            briefId,
            undefined,
            brief.userId // Award to the brief author
          );
        }
      } catch (tokenError) {
        console.warn('Failed to award tokens for receiving upvote:', tokenError);
      }
    }

    revalidatePath('/my-briefs');
    revalidatePath('/profile');
    revalidatePath(`/briefs/${briefId}`);

    return {
      success: true,
      upvoted: !existingUpvote,
    };
  } catch (error) {
    console.error('Error toggling brief upvote:', error);
    return {
      success: false,
      error: 'Failed to toggle upvote',
    };
  }
}

// Add a review to a brief
export async function addBriefReview(briefId: string, content: string, rating: number) {
  try {
    const userId = await getUserId();

    // Check if the brief exists and get its author
    const brief = await db.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!brief) {
      throw new Error('Brief not found');
    }

    // Prevent users from reviewing their own briefs
    if (brief.userId === userId) {
      throw new Error('You cannot review your own brief');
    }

    // Check if user has already reviewed
    const existingReview = await db.review.findFirst({
      where: {
        briefId,
        userId: userId,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this brief');
    }

    // Add review
    const review = await db.review.create({
      data: {
        content,
        rating,
        userId: userId,
        briefId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Award tokens for writing a review
    try {
      const { awardTokens, getTokenRewards } = await import('./tokens');
      const TOKEN_REWARDS = await getTokenRewards();
      await awardTokens(
        TOKEN_REWARDS.WRITE_REVIEW,
        'Review written',
        briefId,
        review.id
      );
    } catch (tokenError) {
      console.warn('Failed to award tokens for review:', tokenError);
      // Don't fail the review creation if token award fails
    }

    // Award tokens to the brief author for receiving a 4 or 5 star review
    try {
      if (rating >= 4) {
        const { awardTokens } = await import('./tokens');
        const rewardAmount = rating === 5 ? 5 : 3; // 5 tokens for 5-star, 3 tokens for 4-star
        await awardTokens(
          rewardAmount,
          `Received ${rating}-star review`,
          briefId,
          review.id,
          brief.userId // Award to the brief author, not the reviewer
        );
      }
    } catch (tokenError) {
      console.warn('Failed to award tokens for receiving review:', tokenError);
      // Don't fail the review creation if token award fails
    }

    revalidatePath('/my-briefs');
    revalidatePath('/profile');
    revalidatePath(`/briefs/${briefId}`);

    return {
      success: true,
      data: review,
    };
  } catch (error) {
    console.error('Error adding brief review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add review',
    };
  }
}

// Delete a review
export async function deleteBriefReview(reviewId: string) {
  try {
    const userId = await getUserId();

    // Check if the review exists and get its author
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, briefId: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Prevent users from deleting reviews they didn't write
    if (review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    // Delete the review
    await db.review.delete({
      where: { id: reviewId },
    });

    revalidatePath('/my-briefs');
    revalidatePath('/profile');
    revalidatePath(`/briefs/${review.briefId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete review',
    };
  }
}

// Toggle save/bookmark a brief
export async function toggleBriefSave(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if brief is already saved
    const existingSave = await db.savedBrief.findUnique({
      where: {
        userId_briefId: {
          userId: userId,
          briefId,
        },
      },
    });

    if (existingSave) {
      // Remove save
      await db.savedBrief.delete({
        where: {
          userId_briefId: {
            userId: userId,
            briefId,
          },
        },
      });
    } else {
      // Add save
      await db.savedBrief.create({
        data: {
          userId: userId,
          briefId,
        },
      });
    }

    revalidatePath('/my-briefs');
    revalidatePath('/profile');
    revalidatePath(`/briefs/${briefId}`);

    return {
      success: true,
      saved: !existingSave,
    };
  } catch (error) {
    console.error('Error toggling brief save:', error);
    return {
      success: false,
      error: 'Failed to toggle save',
    };
  }
}

// Get saved briefs for the current user
export async function getSavedBriefs() {
  try {
    const userId = await getUserId();

    const savedBriefs = await db.savedBrief.findMany({
      where: {
        userId: userId,
      },
      include: {
        brief: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: savedBriefs.map(sb => sb.brief),
    };
  } catch (error) {
    console.error('Error fetching saved briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch saved briefs',
    };
  }
}

// Get upvotes given by the current user
export async function getUserUpvotes() {
  try {
    const userId = await getUserId();

    const upvotes = await db.briefUpvote.findMany({
      where: {
        userId: userId,
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: upvotes,
    };
  } catch (error) {
    console.error('Error fetching user upvotes:', error);
    return {
      success: false,
      error: 'Failed to fetch upvotes',
    };
  }
}

// Search briefs with filters
export async function searchBriefs(searchParams: {
  query?: string;
  categories?: string[];
  model?: string;
  sortBy?: 'popular' | 'new' | 'controversial';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  rating?: 'all' | '4+' | '3+' | '2+';
  page?: number;
  limit?: number;
}) {
  try {
    const {
      query = '',
      categories = [],
      model,
      sortBy = 'popular',
      dateRange = 'all',
      rating = 'all',
      page = 1,
      limit = 20
    } = searchParams;

    console.log('Search briefs with params:', searchParams);

    // First, let's see how many total briefs exist
    const totalBriefs = await db.brief.count();
    console.log(`Total briefs in database: ${totalBriefs}`);

    // Build where clause - remove published requirement for now to test
    const where: any = {};

    // Text search in title, abstract, and response (SQLite compatible)
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { abstract: { contains: query } },
        { response: { contains: query } },
      ];
    }

    // Category filter
    if (categories.length > 0) {
      where.categories = {
        some: {
          name: {
            in: categories
          }
        }
      };
    }

    // Model filter
    if (model && model !== 'All Models') {
      where.model = {
        name: model
      };
    }

    // Date range filter
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
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = {
        gte: startDate
      };
    }

    // Build orderBy clause
    let orderBy: any;
    switch (sortBy) {
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'controversial':
        orderBy = { reviews: { _count: 'desc' } };
        break;
      default: // popular
        orderBy = { viewCount: 'desc' };
    }

    console.log('Executing search with where clause:', JSON.stringify(where, null, 2));
    console.log('Order by:', JSON.stringify(orderBy, null, 2));

    // Execute search
    const briefs = await db.brief.findMany({
      where,
      include: {
        categories: true,
        model: true,
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
        upvotes: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log(`Raw database query returned ${briefs.length} briefs`);
    
    // Log first few brief titles for debugging
    if (briefs.length > 0) {
      console.log('First few brief titles:');
      briefs.slice(0, 3).forEach((brief, index) => {
        console.log(`${index + 1}. "${brief.title}" (ID: ${brief.id})`);
      });
    }

    // Get total count for pagination
    const totalCount = await db.brief.count({ where });
    console.log(`Total count from database: ${totalCount}`);

    // Transform results to match expected format
    const transformedResults = briefs
      .map(brief => {
        // Calculate average rating
        const ratings = brief.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : undefined;

        // Filter by rating if specified
        if (rating !== 'all') {
          const minRating = parseFloat(rating.replace('+', ''));
          if (!averageRating || averageRating < minRating) {
            return null;
          }
        }

        // Calculate reading time (rough estimate: 200 words per minute)
        const wordCount = brief.response?.split(' ').length || 0;
        const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        return {
          id: brief.id,
          title: brief.title,
          abstract: brief.abstract || '',
          model: brief.model?.name || 'Unknown',
          date: brief.createdAt.toISOString().split('T')[0],
          readTime: `${readingTimeMinutes} min`,
          category: brief.categories[0]?.name || 'General',
          views: brief.viewCount || 0,
          rating: averageRating,
          reviewCount: brief.reviews.length,
          slug: brief.slug,
        };
      })
      .filter(Boolean); // Remove null entries from rating filter

    console.log(`Found ${transformedResults.length} briefs matching search criteria`);

    return {
      success: true,
      data: {
        results: transformedResults,
        totalCount: transformedResults.length, // Adjusted for rating filter
        page,
        limit,
        totalPages: Math.ceil(transformedResults.length / limit),
      },
    };
  } catch (error) {
    console.error('Error searching briefs:');
    console.error('Error type:', typeof error);
    console.error('Error value:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search briefs',
    };
  }
}
