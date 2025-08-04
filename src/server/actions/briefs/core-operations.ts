'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { validateInput, createBriefSchema, sanitizeHtml, sanitizeText } from '@/lib/validation';
import { getUserId } from './utils';

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

// Helper function to ensure local user exists
async function ensureLocalUser() {
  try {
    const userId = 'local-user-1';
    
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
    
    console.log('Local user created:', userId);
    return userId;
    
  } catch (error) {
    console.log('Failed to ensure local user:', String(error));
    throw new Error('Failed to create local user');
  }
}

// Create a new brief (initial version)
export async function createBrief(briefData: CreateBriefInput) {
  try {
    console.log('=== createBrief START ===');
    
    // In local mode, ensure local user exists
    let userId;
    try {
      userId = await getUserId();
      console.log('Got user ID:', userId);
    } catch (error) {
      console.log('Using local mode, ensuring local user exists...');
      userId = await ensureLocalUser();
    }

    if (!userId) {
      console.log('No user ID available, ensuring local user...');
      userId = await ensureLocalUser();
    }

    // Validate input
    const validationResult = validateInput(createBriefSchema, briefData);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.errors);
      return {
        success: false,
        error: validationResult.errors?.join(', ') ?? 'Validation failed',
      };
    }

    // Ensure modelId is valid
    if (!briefData.modelId) {
      console.log('Missing modelId');
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

      console.log('Brief created successfully:', brief.id);

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
      console.log('Database error occurred:');
      console.log('Error type:', typeof dbError);
      
      if (dbError) {
        try {
          console.log('Error message:', dbError instanceof Error ? dbError.message : String(dbError));
        } catch (e) {
          console.log('Failed to log error message');
        }
      } else {
        console.log('Error is null or undefined');
      }
      
      throw dbError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    // Safe error logging that won't throw if error is null
    console.log('=== ERROR IN createBrief ===');
    console.log('Error type:', typeof error);
    
    let errorMessage = 'Failed to create brief';
    if (error !== null && error !== undefined) {
      try {
        if (error instanceof Error) {
          errorMessage = error.message;
          console.log('Error is an Error instance');
          console.log('Message:', error.message);
        } else {
          console.log('Error is not an Error instance');
          errorMessage = String(error);
        }
      } catch (e) {
        console.log('Failed to process error');
      }
    } else {
      console.log('Error is null or undefined');
    }
    
    return {
      success: false,
      error: errorMessage
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
    console.error('Error fetching brief by slug:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

// Delete a brief and all its related drafts
export async function deleteBrief(briefId: string) {
  try {
    const userId = await getUserId();

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

    // If deleting an active version, ensure another version becomes active
    if (existingBrief.isActive && !existingBrief.isDraft) {
      const rootBriefId = existingBrief.parentBriefId ?? briefId;
      
      // Find other published versions in this family
      const otherVersions = await prisma.brief.findMany({
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
        await prisma.brief.update({
          where: { id: otherVersions[0]!.id },
          data: { isActive: true },
        });
      }
    }

    // Determine what to delete based on the brief type
    let briefsToDelete: string[] = [];

    if (existingBrief.isDraft) {
      // If deleting a draft, only delete this draft
      briefsToDelete = [briefId];
    } else {
      // If deleting a published version, also delete all its drafts
      const rootBriefId = existingBrief.parentBriefId ?? briefId;
      
      // Find all drafts for this specific version
      const relatedDrafts = await prisma.brief.findMany({
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
      await prisma.reviewHelpful.deleteMany({
        where: {
          review: {
            briefId: briefToDeleteId,
          },
        },
      });

      // Delete review upvotes (they depend on reviews)
      await prisma.reviewUpvote.deleteMany({
        where: {
          review: {
            briefId: briefToDeleteId,
          },
        },
      });

      // Delete reviews
      await prisma.review.deleteMany({
        where: { briefId: briefToDeleteId },
      });

      // Delete AI reviews
      await prisma.aIReview.deleteMany({
        where: { briefId: briefToDeleteId },
      });

      // Delete brief upvotes
      await prisma.briefUpvote.deleteMany({
        where: { briefId: briefToDeleteId },
      });

      // Delete saved briefs
      await prisma.savedBrief.deleteMany({
        where: { briefId: briefToDeleteId },
      });

      // Delete token transactions related to this brief
      await prisma.tokenTransaction.deleteMany({
        where: { briefId: briefToDeleteId },
      });
    }

    // Finally, delete all the briefs
    await prisma.brief.deleteMany({
      where: {
        id: {
          in: briefsToDelete,
        },
      },
    });

    revalidatePath('/my-briefs');
    revalidatePath('/profile');

    return {
      success: true,
      deletedCount: briefsToDelete.length,
    };
  } catch (error) {
    console.error('Error deleting brief:', error);
    return {
      success: false,
      error: 'Failed to delete brief',
    };
  }
}