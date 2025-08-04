'use server';

import { prisma } from '@/lib/prisma';
import { createReviewSchema, validateInput } from '@/lib/validation';
import { getUserId } from './utils';

// Get all briefs saved by the current user
export async function getSavedBriefs() {
  try {
    console.log('Starting getSavedBriefs');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    console.log('Querying database for saved briefs');
    const savedBriefs = await prisma.savedBrief.findMany({
      where: {
        userId,
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
    console.log(`Found ${savedBriefs.length} saved briefs`);

    // Extract the brief data from the savedBrief relationship
    const briefs = savedBriefs.map(savedBrief => savedBrief.brief);

    return {
      success: true,
      data: briefs,
    };
  } catch (error) {
    console.error('Error fetching saved briefs:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'Failed to fetch saved briefs',
    };
  }
}

// Get all reviews written by the current user
export async function getUserReviews() {
  try {
    console.log('Starting getUserReviews');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    console.log('Querying database for user reviews');
    const reviews = await prisma.review.findMany({
      where: {
        userId,
      },
      include: {
        brief: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        upvotes: true,
        helpfulMarks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`Found ${reviews.length} user reviews`);

    return {
      success: true,
      data: reviews,
    };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'Failed to fetch user reviews',
    };
  }
}

// Get all upvotes given by the current user
export async function getUserUpvotes() {
  try {
    console.log('Starting getUserUpvotes');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    console.log('Querying database for user upvotes');
    const upvotes = await prisma.briefUpvote.findMany({
      where: {
        userId,
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
    console.log(`Found ${upvotes.length} user upvotes`);

    return {
      success: true,
      data: upvotes,
    };
  } catch (error) {
    console.error('Error fetching user upvotes:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'Failed to fetch user upvotes',
    };
  }
}

// Toggle brief upvote
export async function toggleBriefUpvote(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if user has already upvoted
    const existingUpvote = await prisma.briefUpvote.findFirst({
      where: {
        briefId: briefId,
        userId: userId,
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.briefUpvote.delete({
        where: { id: existingUpvote.id },
      });
      return {
        success: true,
        upvoted: false,
      };
    } else {
      // Add upvote
      await prisma.briefUpvote.create({
        data: {
          briefId: briefId,
          userId: userId,
        },
      });
      return {
        success: true,
        upvoted: true,
      };
    }
  } catch (error) {
    console.error('Error toggling brief upvote:', error);
    return {
      success: false,
      error: 'Failed to toggle upvote',
    };
  }
}

// Toggle brief save
export async function toggleBriefSave(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if user has already saved
    const existingSave = await prisma.savedBrief.findFirst({
      where: {
        briefId: briefId,
        userId: userId,
      },
    });

    if (existingSave) {
      // Remove save
      await prisma.savedBrief.delete({
        where: { id: existingSave.id },
      });
      return {
        success: true,
        saved: false,
      };
    } else {
      // Add save
      await prisma.savedBrief.create({
        data: {
          briefId: briefId,
          userId: userId,
        },
      });
      return {
        success: true,
        saved: true,
      };
    }
  } catch (error) {
    console.error('Error toggling brief save:', error);
    return {
      success: false,
      error: 'Failed to toggle save',
    };
  }
}

// Add brief review
export async function addBriefReview(briefId: string, content: string, rating: number) {
  try {
    const userId = await getUserId();

    // Validate input
    const validationResult = validateInput(createReviewSchema, { content, rating });
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.errors?.join(', ') ?? 'Validation failed',
      };
    }

    // Check if user has already reviewed this brief
    const existingReview = await prisma.review.findFirst({
      where: {
        briefId: briefId,
        userId: userId,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this brief',
      };
    }

    const review = await prisma.review.create({
      data: {
        content: content,
        rating: rating,
        briefId: briefId,
        userId: userId,
      },
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
    });

    return {
      success: true,
      data: review,
    };
  } catch (error) {
    console.error('Error adding brief review:', error);
    return {
      success: false,
      error: 'Failed to add review',
    };
  }
}

// Delete brief review
export async function deleteBriefReview(reviewId: string) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review || review.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to delete this review',
      };
    }

    // Delete related records first
    await prisma.reviewHelpful.deleteMany({
      where: { reviewId: reviewId },
    });

    await prisma.reviewUpvote.deleteMany({
      where: { reviewId: reviewId },
    });

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting brief review:', error);
    return {
      success: false,
      error: 'Failed to delete review',
    };
  }
}