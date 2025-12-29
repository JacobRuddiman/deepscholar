'use server';

import { prisma } from '@/lib/prisma';
import { createReviewSchema, validateInput } from '@/lib/validation';
import { getUserId } from './utils';

/**
 * Get all briefs saved by the current user
 */
export async function getSavedBriefs() {
  try {
    const userId = await getUserId();

    const savedBriefs = await prisma.savedBrief.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    // Extract the brief data from the savedBrief relationship
    const briefs = savedBriefs.map(savedBrief => savedBrief.brief);

    return {
      success: true,
      data: briefs,
    };
  } catch (error) {
    console.error('[Briefs] Failed to fetch saved briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch saved briefs',
    };
  }
}

/**
 * Get all reviews written by the current user
 */
export async function getUserReviews() {
  try {
    const userId = await getUserId();

    const reviews = await prisma.review.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reviews,
    };
  } catch (error) {
    console.error('[Briefs] Failed to fetch user reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch user reviews',
    };
  }
}

/**
 * Get all upvotes given by the current user
 */
export async function getUserUpvotes() {
  try {
    const userId = await getUserId();

    const upvotes = await prisma.briefUpvote.findMany({
      where: { userId },
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
    });

    return {
      success: true,
      data: upvotes,
    };
  } catch (error) {
    console.error('[Briefs] Failed to fetch user upvotes:', error);
    return {
      success: false,
      error: 'Failed to fetch user upvotes',
    };
  }
}

/**
 * Toggle upvote status for a brief
 * @param briefId - The ID of the brief to upvote/unupvote
 */
export async function toggleBriefUpvote(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if user has already upvoted
    const existingUpvote = await prisma.briefUpvote.findFirst({
      where: { briefId, userId },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.briefUpvote.delete({
        where: { id: existingUpvote.id },
      });
      return { success: true, upvoted: false };
    }

    // Add upvote
    await prisma.briefUpvote.create({
      data: { briefId, userId },
    });
    return { success: true, upvoted: true };
  } catch (error) {
    console.error('[Briefs] Failed to toggle upvote:', error);
    return {
      success: false,
      error: 'Failed to toggle upvote',
    };
  }
}

/**
 * Toggle saved status for a brief
 * @param briefId - The ID of the brief to save/unsave
 */
export async function toggleBriefSave(briefId: string) {
  try {
    const userId = await getUserId();

    // Check if user has already saved
    const existingSave = await prisma.savedBrief.findFirst({
      where: { briefId, userId },
    });

    if (existingSave) {
      // Remove save
      await prisma.savedBrief.delete({
        where: { id: existingSave.id },
      });
      return { success: true, saved: false };
    }

    // Add save
    await prisma.savedBrief.create({
      data: { briefId, userId },
    });
    return { success: true, saved: true };
  } catch (error) {
    console.error('[Briefs] Failed to toggle save:', error);
    return {
      success: false,
      error: 'Failed to toggle save',
    };
  }
}

/**
 * Add a review to a brief
 * @param briefId - The ID of the brief to review
 * @param content - The review content
 * @param rating - The rating (1-5)
 */
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
      where: { briefId, userId },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this brief',
      };
    }

    const review = await prisma.review.create({
      data: { content, rating, briefId, userId },
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
    console.error('[Briefs] Failed to add review:', error);
    return {
      success: false,
      error: 'Failed to add review',
    };
  }
}

/**
 * Delete a review
 * @param reviewId - The ID of the review to delete
 */
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

    // Delete related records first (Prisma cascade might handle this, but being explicit)
    await prisma.$transaction([
      prisma.reviewHelpful.deleteMany({ where: { reviewId } }),
      prisma.reviewUpvote.deleteMany({ where: { reviewId } }),
      prisma.review.delete({ where: { id: reviewId } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('[Briefs] Failed to delete review:', error);
    return {
      success: false,
      error: 'Failed to delete review',
    };
  }
}