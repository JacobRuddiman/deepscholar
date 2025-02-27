'use server';

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  slug: string;
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

// Get all briefs for the current user
export async function getUserBriefs() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const briefs = await prisma.brief.findMany({
      where: {
        userId: session.user.id,
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
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: briefs,
    };
  } catch (error) {
    console.error('Error fetching user briefs:', error);
    return {
      success: false,
      error: 'Failed to fetch briefs',
    };
  }
}

// Get a single brief by ID
export async function getBriefById(briefId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Create the brief
    const brief = await prisma.brief.create({
      data: {
        title: input.title,
        abstract: input.abstract,
        prompt: input.prompt,
        response: input.response,
        thinking: input.thinking,
        slug: input.slug,
        modelId: input.modelId,
        userId: session.user.id,
        ...(input.categoryIds && {
          categories: {
            connect: input.categoryIds.map(id => ({ id })),
          },
        }),
        ...(input.sourceIds && {
          sources: {
            connect: input.sourceIds.map(id => ({ id })),
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

// Update an existing brief
export async function updateBrief(briefId: string, input: UpdateBriefInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Verify ownership
    const existingBrief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!existingBrief || existingBrief.userId !== session.user.id) {
      throw new Error('Not authorized to update this brief');
    }

    // Update the brief
    const brief = await prisma.brief.update({
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Verify ownership
    const existingBrief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!existingBrief || existingBrief.userId !== session.user.id) {
      throw new Error('Not authorized to delete this brief');
    }

    // Delete the brief (this will cascade delete related records)
    await prisma.brief.delete({
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Check if user has already upvoted
    const existingUpvote = await prisma.briefUpvote.findUnique({
      where: {
        briefId_userId: {
          userId: session.user.id,
          briefId,
        },
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.briefUpvote.delete({
        where: {
          briefId_userId: {
            userId: session.user.id,
            briefId,
          },
        },
      });
    } else {
      // Add upvote
      await prisma.briefUpvote.create({
        data: {
          userId: session.user.id,
          briefId,
        },
      });
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Check if user has already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        briefId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this brief');
    }

    // Add review
    const review = await prisma.review.create({
      data: {
        content,
        rating,
        userId: session.user.id,
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

// Toggle save/bookmark a brief
export async function toggleBriefSave(briefId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Check if brief is already saved
    const existingSave = await prisma.savedBrief.findUnique({
      where: {
        userId_briefId: {
          userId: session.user.id,
          briefId,
        },
      },
    });

    if (existingSave) {
      // Remove save
      await prisma.savedBrief.delete({
        where: {
          userId_briefId: {
            userId: session.user.id,
            briefId,
          },
        },
      });
    } else {
      // Add save
      await prisma.savedBrief.create({
        data: {
          userId: session.user.id,
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const savedBriefs = await prisma.savedBrief.findMany({
      where: {
        userId: session.user.id,
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