'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
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

// Create a new brief (initial version)
export async function createBrief(briefData: CreateBriefInput) {
  try {
    const userId = await getUserId();

    // Validate input
    const validationResult = validateInput(createBriefSchema, briefData);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.errors?.join(', ') ?? 'Validation failed',
      };
    }

    // Sanitize content
    const sanitizedData = {
      ...briefData,
      title: sanitizeText(briefData.title),
      abstract: briefData.abstract ? sanitizeText(briefData.abstract) : null,
      prompt: sanitizeText(briefData.prompt),
      response: sanitizeHtml(briefData.response),
      thinking: briefData.thinking ? sanitizeText(briefData.thinking) : undefined,
    };

    // Create the brief
    const brief = await prisma.brief.create({
      data: {
        title: sanitizedData.title,
        abstract: sanitizedData.abstract,
        prompt: sanitizedData.prompt,
        response: sanitizedData.response,
        thinking: sanitizedData.thinking,
        modelId: briefData.modelId,
        userId: userId,
        slug: briefData.slug,
        versionNumber: 1, // First version
        isDraft: false,
        published: true,
        isActive: true, // New briefs are active by default
        ...(briefData.categoryIds && briefData.categoryIds.length > 0 && {
          categories: {
            connect: briefData.categoryIds.map((id: string) => ({ id })),
          },
        }),
        ...(briefData.sourceIds && briefData.sourceIds.length > 0 && {
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

    revalidatePath('/my-briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: brief,
    };
  } catch (error) {
    console.error('Error creating brief:', error);
    return {
      success: false,
      error: 'Failed to create brief',
    };
  }
}

// Get all briefs for the current user (only active versions)
export async function getUserBriefs() {
  try {
    console.log('Starting getUserBriefs');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    console.log('Querying database for briefs');
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
    console.log(`Found ${briefs.length} active briefs`);

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

export async function getBriefById(briefId: string) {
  try {
    console.log('Starting getBriefById');
    
    const userId = await getUserId();
    console.log('Using userId:', userId);

    const brief = await prisma.brief.findUnique({
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

    // Ensure we return the response field as content for the editor
    const briefWithContent = {
      ...brief,
      content: brief.response, // Map response to content for editor compatibility
    };

    return {
      success: true,
      data: briefWithContent,
    };
  } catch (error) {
    console.error('Error fetching brief:', error);
    return {
      success: false,
      error: 'Failed to fetch brief',
    };
  }
}

// Get all versions of a brief
export async function getBriefVersions(briefId: string) {
  try {
    const userId = await getUserId();

    // Get the root brief (original or any version to find the parent)
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        id: true, 
        parentBriefId: true, 
        userId: true,
        versionNumber: true 
      },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    // Find the root brief ID (either this brief if it's the original, or its parent)
    const rootBriefId = brief.parentBriefId ?? brief.id;

    // Get all versions (including the root brief)
    const versions = await prisma.brief.findMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ]
      },
      select: {
        id: true,
        versionNumber: true,
        changeLog: true,
        createdAt: true,
        updatedAt: true,
        isDraft: true,
        isActive: true,
        userId: true,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    return {
      success: true,
      data: versions,
      isOwner: brief.userId === userId,
    };
  } catch (error) {
    console.error('Error fetching brief versions:', error);
    return {
      success: false,
      error: 'Failed to fetch brief versions',
    };
  }
}

// Create a new version of a brief
export async function createBriefVersion(
  parentBriefId: string, 
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  },
  changeLog: string
) {
  try {
    const userId = await getUserId();

    // Verify ownership of the parent brief
    const parentBrief = await prisma.brief.findUnique({
      where: { id: parentBriefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        modelId: true,
        versionNumber: true 
      },
    });

    if (!parentBrief || parentBrief.userId !== userId) {
      throw new Error('Not authorized to create version of this brief');
    }

    // Find the root brief ID and get the highest version number
    const rootBriefId = parentBrief.parentBriefId ?? parentBriefId;
    
    const highestVersion = await prisma.brief.findFirst({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ]
      },
      orderBy: {
        versionNumber: 'desc',
      },
      select: {
        versionNumber: true,
      },
    });

    const newVersionNumber = (highestVersion?.versionNumber ?? 0) + 1;

    // First, set all existing versions in this brief family to inactive
    await prisma.brief.updateMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ],
        isDraft: false, // Only update published versions
      },
      data: {
        isActive: false,
      },
    });

    // Create the new version
    const newVersion = await prisma.brief.create({
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        modelId: parentBrief.modelId,
        userId: userId,
        parentBriefId: rootBriefId,
        versionNumber: newVersionNumber,
        changeLog: changeLog,
        isDraft: false,
        published: true,
        isActive: true, // New versions are active by default
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

    revalidatePath('/my-briefs');
    revalidatePath(`/briefs/${parentBriefId}`);
    revalidatePath(`/briefs/${newVersion.id}`);

    return {
      success: true,
      data: newVersion,
    };
  } catch (error) {
    console.error('Error creating brief version:', error);
    return {
      success: false,
      error: 'Failed to create brief version',
    };
  }
}

// Update an existing version or draft
export async function updateBriefVersion(
  briefId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        isDraft: true 
      },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to update this brief');
    }

    // Update the brief
    const updatedBrief = await prisma.brief.update({
      where: { id: briefId },
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        ...(briefData.categoryIds && {
          categories: {
            set: briefData.categoryIds.map(id => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            set: briefData.sourceIds.map(id => ({ id })),
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

    return {
      success: true,
      data: updatedBrief,
    };
  } catch (error) {
    console.error('Error updating brief version:', error);
    return {
      success: false,
      error: 'Failed to update brief version',
    };
  }
}

// Push draft to version (update version with draft content and delete draft)
export async function pushDraftToVersion(
  draftId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Get the draft
    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        versionNumber: true,
        isDraft: true 
      },
    });

    if (!draft || draft.userId !== userId || !draft.isDraft) {
      throw new Error('Not authorized or invalid draft');
    }

    // Find the published version for this version number
    const publishedVersion = await prisma.brief.findFirst({
      where: {
        OR: [
          ...(draft.parentBriefId ? [{ id: draft.parentBriefId }] : []),
          ...(draft.parentBriefId ? [{ parentBriefId: draft.parentBriefId }] : [])
        ],
        versionNumber: draft.versionNumber,
        isDraft: false,
      },
    });

    if (!publishedVersion) {
      throw new Error('Published version not found');
    }

    // Update the published version with draft content
    const updatedVersion = await prisma.brief.update({
      where: { id: publishedVersion.id },
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        ...(briefData.categoryIds && {
          categories: {
            set: briefData.categoryIds.map(id => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            set: briefData.sourceIds.map(id => ({ id })),
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

    // Delete the draft
    await prisma.brief.delete({
      where: { id: draftId },
    });

    return {
      success: true,
      data: updatedVersion,
    };
  } catch (error) {
    console.error('Error pushing draft to version:', error);
    return {
      success: false,
      error: 'Failed to push draft to version',
    };
  }
}

// Rename a version
export async function renameBriefVersion(
  briefId: string,
  newChangeLog: string
) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to rename this version');
    }

    // Update the change log
    const updatedBrief = await prisma.brief.update({
      where: { id: briefId },
      data: {
        changeLog: newChangeLog,
      },
    });

    return {
      success: true,
      data: updatedBrief,
    };
  } catch (error) {
    console.error('Error renaming brief version:', error);
    return {
      success: false,
      error: 'Failed to rename version',
    };
  }
}

// Save current edits as a draft version
export async function saveBriefDraft(
  briefId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Get the current brief to determine its version structure
    const currentBrief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        modelId: true,
        versionNumber: true,
        isDraft: true
      },
    });

    if (!currentBrief || currentBrief.userId !== userId) {
      throw new Error('Not authorized to save draft of this brief');
    }

    // Determine the correct version number and root brief ID
    let targetVersionNumber: number;
    let rootBriefId: string;

    if (currentBrief.isDraft) {
      // If current is already a draft, use its version number and parent
      targetVersionNumber = currentBrief.versionNumber;
      rootBriefId = currentBrief.parentBriefId ?? briefId;
    } else {
      // If current is a published version, use its version number
      targetVersionNumber = currentBrief.versionNumber;
      rootBriefId = currentBrief.parentBriefId ?? briefId;
    }
    
    // Get existing drafts for this specific version to determine draft number
    const existingDrafts = await prisma.brief.findMany({
      where: {
        parentBriefId: rootBriefId,
        versionNumber: targetVersionNumber,
        isDraft: true,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if we can create a new draft (max 3 drafts per version)
    if (existingDrafts.length >= 3) {
      // Update the oldest draft instead
      const oldestDraft = existingDrafts[existingDrafts.length - 1];
      if (!oldestDraft) {
        throw new Error('Failed to find oldest draft');
      }
      
      const updatedDraft = await prisma.brief.update({
        where: { id: oldestDraft.id },
        data: {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: briefData.prompt,
          response: briefData.response,
          thinking: briefData.thinking,
          changeLog: `Draft changes - ${new Date().toLocaleString()}`,
          ...(briefData.categoryIds && {
            categories: {
              set: briefData.categoryIds.map(id => ({ id })),
            },
          }),
          ...(briefData.sourceIds && {
            sources: {
              set: briefData.sourceIds.map(id => ({ id })),
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

      return {
        success: true,
        data: updatedDraft,
      };
    } else {
      // Create new draft with the correct version number
      const draft = await prisma.brief.create({
        data: {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: briefData.prompt,
          response: briefData.response,
          thinking: briefData.thinking,
          modelId: currentBrief.modelId,
          userId: userId,
          parentBriefId: rootBriefId,
          versionNumber: targetVersionNumber,
          isDraft: true,
          published: false,
          changeLog: `Draft ${existingDrafts.length + 1} - ${new Date().toLocaleString()}`,
          ...(briefData.categoryIds && {
            categories: {
              connect: briefData.categoryIds.map(id => ({ id })),
            },
          }),
          ...(briefData.sourceIds && {
            sources: {
              connect: briefData.sourceIds.map(id => ({ id })),
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

      return {
        success: true,
        data: draft,
      };
    }
  } catch (error) {
    console.error('Error saving brief draft:', error);
    return {
      success: false,
      error: 'Failed to save brief draft',
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

    // Validate rating
    if (rating < 1 || rating > 5) {
      return {
        success: false,
        error: 'Rating must be between 1 and 5',
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

// Set a version as the active version (only one can be active per brief family)
export async function setActiveVersion(briefId: string) {
  try {
    const userId = await getUserId();

    // Get the brief to check ownership and determine the root brief
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        isDraft: true,
        versionNumber: true 
      },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to set active version for this brief');
    }

    // Drafts cannot be set as active
    if (brief.isDraft) {
      throw new Error('Drafts cannot be set as the active version');
    }

    // Find the root brief ID
    const rootBriefId = brief.parentBriefId ?? briefId;

    // First, set all versions in this brief family to inactive
    await prisma.brief.updateMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ],
        isDraft: false, // Only update published versions
      },
      data: {
        isActive: false,
      },
    });

    // Then set the specified version as active
    await prisma.brief.update({
      where: { id: briefId },
      data: {
        isActive: true,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error setting active version:', error);
    return {
      success: false,
      error: 'Failed to set active version',
    };
  }
}

// Search briefs with comprehensive filtering
export async function searchBriefs({
  query,
  categories,
  model,
  sortBy = 'popular',
  dateRange = 'all',
  rating = 'all',
  page = 1,
  limit = 20
}: {
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
    console.log('searchBriefs called with params:', {
      query, categories, model, sortBy, dateRange, rating, page, limit
    });

    // Build where clause for filtering
    const whereClause: any = {
      published: true,
      isActive: true, // Only show active versions
      isDraft: false, // Exclude drafts
    };

    // Text search in title, abstract, and content with normalization
    if (query && query.trim()) {
      const normalizedQuery = query.trim();
      console.log('Searching for normalized query:', normalizedQuery);
      
      whereClause.OR = [
        {
          title: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          abstract: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        {
          response: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
      ];
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
          contains: model,
          mode: 'insensitive',
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
