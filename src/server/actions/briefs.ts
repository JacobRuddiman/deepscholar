'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
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
    console.log('Starting getUserBriefs');
    
    // Check for dev mode
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    console.log('Dev mode:', isDevMode);
    
    let userId;
    
    if (isDevMode) {
      console.log('In dev mode - using fake user ID');
      userId = 'dev-user-id';
    } else {
  try {
    const session = await auth();
        console.log('Auth session result:', {
          exists: !!session,
          user: session?.user ? { id: session.user.id, name: session.user.name } : 'No user'
        });
        
    if (!session?.user?.id) {
          console.log('Not authenticated');
      throw new Error('Not authenticated');
    }

        userId = session.user.id;
      } catch (authError) {
        console.error('Error in authentication:', authError);
        throw new Error('Authentication error');
      }
    }
    
    console.log('Using userId:', userId);

    console.log('Querying database for briefs');
    const briefs = await prisma.brief.findMany({
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
        createdAt: 'desc',
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

// Get a single brief by ID
export async function getBriefById(briefId: string) {
  try {
    console.log('Starting getBriefById');
    
    // Check for dev mode
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    console.log('Dev mode:', isDevMode);
    
    let userId;
    
    if (isDevMode) {
      console.log('In dev mode - using fake user ID');
      userId = 'dev-user-id';
    } else {
  try {
    const session = await auth();
        console.log('Auth session result:', {
          exists: !!session,
          user: session?.user ? { id: session.user.id, name: session.user.name } : 'No user'
        });
        
    if (!session?.user?.id) {
          console.log('Not authenticated');
      throw new Error('Not authenticated');
    }
        
        userId = session.user.id;
      } catch (authError) {
        console.error('Error in authentication:', authError);
        throw new Error('Authentication error');
      }
    }
    
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
      prompt: input.prompt || 'placeholder'
    };

    // Log environment and mode
    console.log('📋 ENVIRONMENT CHECK');
    console.log('------------------------------------------');
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    console.log('Dev mode:', isDevMode);
    console.log('Node environment:', process.env.NODE_ENV);
    console.log('------------------------------------------\n');

    // Authentication logging
    console.log('🔐 AUTHENTICATION CHECK');
    console.log('------------------------------------------');
    let userId;
    
    if (isDevMode) {
      console.log('Using dev mode - fake user ID');
      userId = 'dev-user-id';
    } else {
      try {
        const session = await auth();
        console.log('Auth session details:', {
          exists: !!session,
          user: session?.user ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          } : 'No user'
        });
        
        if (!session?.user?.id) {
          console.log('❌ Authentication failed: No user ID in session');
          throw new Error('Not authenticated');
        }
        
        userId = session.user.id;
        console.log('✅ Authentication successful');
      } catch (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error('Authentication error');
      }
    }
    console.log('User ID being used:', userId);
    console.log('------------------------------------------\n');

    // Input validation logging
    console.log('📝 INPUT VALIDATION');
    console.log('------------------------------------------');
    console.log('Raw input data:', JSON.stringify(briefData, null, 2));
    
    // Validate required fields
    const requiredFields = ['title', 'prompt', 'response', 'modelId', 'slug'];
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
    console.log('- categoryIds:', briefData.categoryIds?.length || 0);
    console.log('- sourceIds:', briefData.sourceIds?.length || 0);
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
      categoryCount: briefData.categoryIds?.length || 0,
      sourceCount: briefData.sourceIds?.length || 0
    });

    // Create the brief
    const brief = await prisma.brief.create({
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        slug: briefData.slug,
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
      authorId: brief.author ? brief.author.id : null,
      hasModel: !!brief.model,
      modelId: brief.model ? brief.model.id : null,
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