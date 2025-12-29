'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateInput, createBriefSchema, sanitizeHtml, sanitizeText } from '@/lib/validation';
import { getUserId } from './utils';
import { LOCAL_USER } from '@/lib/localMode';

/**
 * Server actions for managing draft briefs
 */

type DraftBriefInput = {
  title?: string;
  abstract?: string | null;
  prompt?: string;
  response?: string;
  thinking?: string;
  categoryIds?: string[];
  sourceIds?: string[];
  modelId?: string;
};

/**
 * Create a new draft brief
 */
export async function createDraft(briefData: Partial<DraftBriefInput>) {
  try {
    let userId;
    try {
      userId = await getUserId();
    } catch (error) {
      userId = LOCAL_USER.id;
    }

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // For drafts, only title is required
    if (!briefData.title || briefData.title.trim() === '') {
      return {
        success: false,
        error: 'Title is required',
      };
    }

    // Use a default model if not provided
    const defaultModel = await prisma.researchAIModel.findFirst();
    if (!defaultModel) {
      return {
        success: false,
        error: 'No AI models available',
      };
    }

    const draft = await prisma.brief.create({
      data: {
        title: sanitizeText(briefData.title),
        abstract: briefData.abstract ? sanitizeText(briefData.abstract) : null,
        prompt: briefData.prompt ? sanitizeText(briefData.prompt) : '',
        response: briefData.response ? sanitizeHtml(briefData.response) : '',
        thinking: briefData.thinking || null,
        modelId: briefData.modelId || defaultModel.id,
        userId,
        isDraft: true,
        published: false,
        isActive: true,
        categories: briefData.categoryIds
          ? {
              connect: briefData.categoryIds.map((id) => ({ id })),
            }
          : undefined,
        sources: briefData.sourceIds
          ? {
              connect: briefData.sourceIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: true,
        model: true,
      },
    });

    revalidatePath('/dashboard/drafts');

    return {
      success: true,
      data: draft,
    };
  } catch (error) {
    console.error('[Drafts] Failed to create draft:', error);
    return {
      success: false,
      error: 'Failed to create draft',
    };
  }
}

/**
 * Update an existing draft
 */
export async function updateDraft(draftId: string, updates: Partial<DraftBriefInput>) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      select: { userId: true, isDraft: true },
    });

    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    if (draft.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to update this draft',
      };
    }

    if (!draft.isDraft) {
      return {
        success: false,
        error: 'Cannot update published brief as draft',
      };
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) {
      updateData.title = sanitizeText(updates.title);
    }

    if (updates.abstract !== undefined) {
      updateData.abstract = updates.abstract ? sanitizeText(updates.abstract) : null;
    }

    if (updates.prompt !== undefined) {
      updateData.prompt = sanitizeText(updates.prompt);
    }

    if (updates.response !== undefined) {
      updateData.response = sanitizeHtml(updates.response);
    }

    if (updates.thinking !== undefined) {
      updateData.thinking = updates.thinking || null;
    }

    if (updates.modelId) {
      updateData.modelId = updates.modelId;
    }

    if (updates.categoryIds) {
      updateData.categories = {
        set: [],
        connect: updates.categoryIds.map((id) => ({ id })),
      };
    }

    if (updates.sourceIds) {
      updateData.sources = {
        set: [],
        connect: updates.sourceIds.map((id) => ({ id })),
      };
    }

    const updatedDraft = await prisma.brief.update({
      where: { id: draftId },
      data: updateData,
      include: {
        categories: true,
        sources: true,
        model: true,
      },
    });

    revalidatePath('/dashboard/drafts');
    revalidatePath(`/dashboard/drafts/${draftId}`);

    return {
      success: true,
      data: updatedDraft,
    };
  } catch (error) {
    console.error('[Drafts] Failed to update draft:', error);
    return {
      success: false,
      error: 'Failed to update draft',
    };
  }
}

/**
 * Auto-save draft (debounced on client)
 */
export async function autoSaveDraft(draftId: string, updates: Partial<DraftBriefInput>) {
  return updateDraft(draftId, updates);
}

/**
 * Publish a draft
 */
export async function publishDraft(draftId: string) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      select: {
        userId: true,
        isDraft: true,
        title: true,
        prompt: true,
        response: true,
      },
    });

    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    if (draft.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to publish this draft',
      };
    }

    if (!draft.isDraft) {
      return {
        success: false,
        error: 'Brief is already published',
      };
    }

    // Validate required fields for publishing
    if (!draft.title || !draft.prompt || !draft.response) {
      return {
        success: false,
        error: 'Title, prompt, and response are required for publishing',
      };
    }

    // Generate slug from title
    const baseSlug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.brief.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Publish the draft
    const published = await prisma.brief.update({
      where: { id: draftId },
      data: {
        isDraft: false,
        published: true,
        slug,
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

    revalidatePath('/dashboard/drafts');
    revalidatePath('/dashboard/briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: published,
    };
  } catch (error) {
    console.error('[Drafts] Failed to publish draft:', error);
    return {
      success: false,
      error: 'Failed to publish draft',
    };
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      select: { userId: true, isDraft: true },
    });

    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    if (draft.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to delete this draft',
      };
    }

    if (!draft.isDraft) {
      return {
        success: false,
        error: 'Cannot delete published brief as draft',
      };
    }

    await prisma.brief.delete({
      where: { id: draftId },
    });

    revalidatePath('/dashboard/drafts');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Drafts] Failed to delete draft:', error);
    return {
      success: false,
      error: 'Failed to delete draft',
    };
  }
}

/**
 * Get all drafts for the current user
 */
export async function getUserDrafts() {
  try {
    const userId = await getUserId();

    const drafts = await prisma.brief.findMany({
      where: {
        userId,
        isDraft: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        categories: true,
        model: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: drafts,
    };
  } catch (error) {
    console.error('[Drafts] Failed to fetch drafts:', error);
    return {
      success: false,
      error: 'Failed to fetch drafts',
    };
  }
}

/**
 * Get a specific draft by ID
 */
export async function getDraftById(draftId: string) {
  try {
    const userId = await getUserId();

    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      include: {
        categories: true,
        sources: true,
        model: true,
      },
    });

    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
      };
    }

    if (draft.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to access this draft',
      };
    }

    if (!draft.isDraft) {
      return {
        success: false,
        error: 'This is not a draft',
      };
    }

    return {
      success: true,
      data: draft,
    };
  } catch (error) {
    console.error('[Drafts] Failed to fetch draft:', error);
    return {
      success: false,
      error: 'Failed to fetch draft',
    };
  }
}

/**
 * Duplicate a published brief as a draft (for creating new versions)
 */
export async function duplicateAsDraft(briefId: string) {
  try {
    const userId = await getUserId();

    const original = await prisma.brief.findUnique({
      where: { id: briefId },
      include: {
        categories: true,
        sources: true,
      },
    });

    if (!original) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    if (original.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to duplicate this brief',
      };
    }

    const draft = await prisma.brief.create({
      data: {
        title: `${original.title} (Draft Copy)`,
        abstract: original.abstract,
        prompt: original.prompt,
        response: original.response,
        thinking: original.thinking,
        modelId: original.modelId,
        userId,
        isDraft: true,
        published: false,
        isActive: true,
        categories: {
          connect: original.categories.map((c) => ({ id: c.id })),
        },
        sources: {
          connect: original.sources.map((s) => ({ id: s.id })),
        },
      },
      include: {
        categories: true,
        sources: true,
        model: true,
      },
    });

    revalidatePath('/dashboard/drafts');

    return {
      success: true,
      data: draft,
    };
  } catch (error) {
    console.error('[Drafts] Failed to duplicate as draft:', error);
    return {
      success: false,
      error: 'Failed to duplicate brief',
    };
  }
}
