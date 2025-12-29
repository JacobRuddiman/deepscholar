'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { validateInput, createBriefSchema, sanitizeHtml, sanitizeText } from '@/lib/validation';
import { getUserId } from './utils';
import { LOCAL_USER } from '@/lib/localMode';

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

/**
 * Helper function to ensure local user exists in local mode
 * Creates the user if it doesn't exist
 * @returns The local user ID
 * @private
 */
async function ensureLocalUser() {
  try {
    const userId = LOCAL_USER.id;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (existingUser) {
      return userId;
    }
    
    // Create local user if it doesn't exist
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Local User',
        email: 'local@example.com',
        isSeedData: false,
      }
    });

    return userId;

  } catch (error) {
    console.error('[Briefs] Failed to ensure local user:', error);
    throw new Error('Failed to create local user');
  }
}

/**
 * Create a new brief (initial version)
 * @param briefData - The data for the new brief
 * @returns Success result with the created brief or error
 */
export async function createBrief(briefData: CreateBriefInput) {
  try {
    // In local mode, ensure local user exists
    let userId;
    try {
      userId = await getUserId();
    } catch (error) {
      userId = await ensureLocalUser();
    }

    if (!userId) {
      userId = await ensureLocalUser();
    }

    // Validate input
    const validationResult = validateInput(createBriefSchema, briefData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.errors?.join(', ') ?? 'Validation failed',
      };
    }

    // Ensure modelId is valid
    if (!briefData.modelId) {
      return {
        success: false,
        error: 'Model ID is required',
      };
    }

    try {
      // Create the brief with minimal required fields first
      const brief = await prisma.brief.create({
        data: {
          title: sanitizeText(briefData.title),
          prompt: sanitizeText(briefData.prompt),
          response: sanitizeHtml(briefData.response),
          modelId: briefData.modelId,
          userId: userId,
          viewCount: 0,
          versionNumber: 1,
          isDraft: false,
          published: true,
          isActive: true,
          isSeedData: false,
          // Only include optional fields if they have values
          ...(briefData.abstract ? { abstract: sanitizeText(briefData.abstract) } : {}),
          ...(briefData.thinking ? { thinking: sanitizeText(briefData.thinking) } : {}),
          ...(briefData.slug ? { slug: sanitizeText(briefData.slug) } : {}),
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

      // Update relations in a separate step if needed
      if (briefData.categoryIds && briefData.categoryIds.length > 0) {
        await prisma.brief.update({
          where: { id: brief.id },
          data: {
            categories: {
              connect: briefData.categoryIds.map((id) => ({ id })),
            },
          },
        });
      }

      if (briefData.sourceIds && briefData.sourceIds.length > 0) {
        await prisma.brief.update({
          where: { id: brief.id },
          data: {
            sources: {
              connect: briefData.sourceIds.map((id) => ({ id })),
            },
          },
        });
      }

      revalidatePath('/my-briefs');
      revalidatePath('/briefs');

      return {
        success: true,
        data: brief,
      };
    } catch (dbError) {
      console.error('[Briefs] Database error during brief creation:', dbError);
      throw dbError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create brief';
    console.error('[Briefs] Failed to create brief:', error);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get all briefs for the current user (only active versions)
 * @returns Success result with array of briefs or error
 */
export async function getUserBriefs() {
  try {
    const userId = await getUserId();

    const briefs = await prisma.brief.findMany({
      where: {
        userId,
        isActive: true, // Only return active versions
        isDraft: false, // Exclude drafts
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

    return {
      success: true,
      data: briefs,
    };
  } catch (error) {
    console.error('[Briefs] Failed to fetch user briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch briefs',
    };
  }
}


/**
 * Get brief by ID (for editing)
 * Verifies the user has permission to access this brief
 * @param briefId - The ID of the brief to fetch
 * @returns Success result with brief data or error
 */
export async function getBriefById(briefId: string) {
  try {
    const userId = await getUserId();

    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      include: {
        categories: true,
        sources: true,
        upvotes: true,
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
            createdAt: 'desc',
          },
        },
        aiReviews: {
          include: {
            model: true,
          },
        },
        savedBy: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        references: {
          include: {
            source: true,
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

    // Verify user has permission to access this brief
    if (brief.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to access this brief',
      };
    }

    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.error('[Briefs] Failed to fetch brief by ID:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

// Get brief by slug (for public viewing)
export async function getBriefBySlug(slug: string) {
  try {
    const brief = await prisma.brief.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug }
        ],
        published: true,
      },
      include: {
        categories: true,
        sources: true,
        upvotes: true,
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
            createdAt: 'desc',
          },
        },
        aiReviews: {
          include: {
            model: true,
          },
        },
        savedBy: true,
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
    console.error('[Briefs] Failed to fetch brief by slug:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

/**
 * Delete a brief and all its related drafts
 * For root briefs, deletes all versions and drafts in the family
 * @param briefId - The ID of the brief to delete
 * @returns Success result with deletion count or error
 */
export async function deleteBrief(briefId: string) {
  try {
    const userId = await getUserId();
    let briefsToDelete: string[] = [];

    // Get the brief to check ownership and determine if it's a version or root brief
    const existingBrief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        versionNumber: true,
        isDraft: true,
        isActive: true 
      },
    });

    if (!existingBrief || existingBrief.userId !== userId) {
      throw new Error('Not authorized to delete this brief');
    }

    // Wrap all deletion operations in a transaction to prevent version conflicts
    await prisma.$transaction(async (tx) => {
      // If deleting an active version, ensure another version becomes active
      if (existingBrief.isActive && !existingBrief.isDraft) {
        const rootBriefId = existingBrief.parentBriefId ?? briefId;

        // Find other published versions in this family
        const otherVersions = await tx.brief.findMany({
          where: {
            OR: [
              { id: rootBriefId },
              { parentBriefId: rootBriefId }
            ],
            isDraft: false,
            id: { not: briefId }, // Exclude the one being deleted
          },
          orderBy: {
            versionNumber: 'desc', // Get the latest version
          },
        });

        if (otherVersions.length > 0) {
          // Set the latest other version as active
          await tx.brief.update({
            where: { id: otherVersions[0]!.id },
            data: { isActive: true },
          });
        }
      }

      // Determine what to delete based on the brief type
      if (existingBrief.isDraft) {
        // If deleting a draft, only delete this draft
        briefsToDelete = [briefId];
      } else {
        // If deleting a published version, also delete all its drafts
        const rootBriefId = existingBrief.parentBriefId ?? briefId;

        // Find all drafts for this specific version
        const relatedDrafts = await tx.brief.findMany({
          where: {
            parentBriefId: rootBriefId,
            versionNumber: existingBrief.versionNumber,
            isDraft: true,
            userId: userId,
          },
          select: { id: true },
        });

        briefsToDelete = [briefId, ...relatedDrafts.map(draft => draft.id)];
      }

      // Delete related records for all briefs to be deleted
      for (const briefToDeleteId of briefsToDelete) {
        // Delete review helpful marks first (they depend on reviews)
        await tx.reviewHelpful.deleteMany({
          where: {
            review: {
              briefId: briefToDeleteId,
            },
          },
        });

        // Delete review upvotes (they depend on reviews)
        await tx.reviewUpvote.deleteMany({
          where: {
            review: {
              briefId: briefToDeleteId,
            },
          },
        });

        // Delete reviews
        await tx.review.deleteMany({
          where: { briefId: briefToDeleteId },
        });

        // Delete AI reviews
        await tx.aIReview.deleteMany({
          where: { briefId: briefToDeleteId },
        });

        // Delete brief upvotes
        await tx.briefUpvote.deleteMany({
          where: { briefId: briefToDeleteId },
        });

        // Delete saved briefs
        await tx.savedBrief.deleteMany({
          where: { briefId: briefToDeleteId },
        });

        // Delete token transactions related to this brief
        await tx.tokenTransaction.deleteMany({
          where: { briefId: briefToDeleteId },
        });
      }

      // Finally, delete all the briefs
      await tx.brief.deleteMany({
        where: {
          id: {
            in: briefsToDelete,
          },
        },
      });
    });

    revalidatePath('/my-briefs');
    revalidatePath('/profile');

    return {
      success: true,
      deletedCount: briefsToDelete.length,
    };
  } catch (error) {
    console.error('[Briefs] Failed to delete brief:', error);
    return {
      success: false,
      error: 'Failed to delete brief',
    };
  }
}