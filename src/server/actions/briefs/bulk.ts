'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server actions for bulk brief operations
 */

/**
 * Bulk delete briefs
 */
export async function bulkDeleteBriefs(briefIds: string[]) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in to delete briefs',
      };
    }

    if (briefIds.length === 0) {
      return {
        success: false,
        error: 'No briefs selected',
      };
    }

    // Verify ownership of all briefs
    const briefs = await prisma.brief.findMany({
      where: {
        id: { in: briefIds },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const unauthorizedBriefs = briefs.filter((b) => b.userId !== session.user.id);

    if (unauthorizedBriefs.length > 0) {
      return {
        success: false,
        error: `You are not authorized to delete ${unauthorizedBriefs.length} of the selected briefs`,
      };
    }

    // Delete all briefs
    const result = await prisma.brief.deleteMany({
      where: {
        id: { in: briefIds },
        userId: session.user.id,
      },
    });

    revalidatePath('/dashboard/briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: {
        count: result.count,
      },
    };
  } catch (error) {
    console.error('[Bulk] Failed to delete briefs:', error);
    return {
      success: false,
      error: 'Failed to delete briefs',
    };
  }
}

/**
 * Bulk publish drafts
 */
export async function bulkPublishDrafts(draftIds: string[]) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in to publish drafts',
      };
    }

    if (draftIds.length === 0) {
      return {
        success: false,
        error: 'No drafts selected',
      };
    }

    // Get drafts and verify ownership
    const drafts = await prisma.brief.findMany({
      where: {
        id: { in: draftIds },
        isDraft: true,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        prompt: true,
        response: true,
        slug: true,
      },
    });

    const unauthorizedDrafts = drafts.filter((d) => d.userId !== session.user.id);

    if (unauthorizedDrafts.length > 0) {
      return {
        success: false,
        error: `You are not authorized to publish ${unauthorizedDrafts.length} of the selected drafts`,
      };
    }

    // Validate all drafts have required fields
    const invalidDrafts = drafts.filter(
      (d) => !d.title || !d.prompt || !d.response
    );

    if (invalidDrafts.length > 0) {
      return {
        success: false,
        error: `${invalidDrafts.length} drafts are missing required fields (title, prompt, response)`,
      };
    }

    // Generate slugs for drafts without them
    const draftsToUpdate = await Promise.all(
      drafts.map(async (draft) => {
        if (draft.slug) return { id: draft.id, slug: draft.slug };

        // Generate slug
        const baseSlug = draft.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.brief.findFirst({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        return { id: draft.id, slug };
      })
    );

    // Update all drafts to published
    const results = await Promise.all(
      draftsToUpdate.map((draft) =>
        prisma.brief.update({
          where: { id: draft.id },
          data: {
            isDraft: false,
            published: true,
            slug: draft.slug,
          },
        })
      )
    );

    revalidatePath('/dashboard/drafts');
    revalidatePath('/dashboard/briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: {
        count: results.length,
      },
    };
  } catch (error) {
    console.error('[Bulk] Failed to publish drafts:', error);
    return {
      success: false,
      error: 'Failed to publish drafts',
    };
  }
}

/**
 * Bulk update brief visibility
 */
export async function bulkUpdateVisibility(
  briefIds: string[],
  isPublic: boolean
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in',
      };
    }

    if (briefIds.length === 0) {
      return {
        success: false,
        error: 'No briefs selected',
      };
    }

    // Verify ownership
    const briefs = await prisma.brief.findMany({
      where: {
        id: { in: briefIds },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const unauthorizedBriefs = briefs.filter((b) => b.userId !== session.user.id);

    if (unauthorizedBriefs.length > 0) {
      return {
        success: false,
        error: `You are not authorized to modify ${unauthorizedBriefs.length} of the selected briefs`,
      };
    }

    // Update visibility
    const result = await prisma.brief.updateMany({
      where: {
        id: { in: briefIds },
        userId: session.user.id,
      },
      data: {
        published: isPublic,
      },
    });

    revalidatePath('/dashboard/briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: {
        count: result.count,
      },
    };
  } catch (error) {
    console.error('[Bulk] Failed to update visibility:', error);
    return {
      success: false,
      error: 'Failed to update visibility',
    };
  }
}

/**
 * Bulk add categories to briefs
 */
export async function bulkAddCategories(
  briefIds: string[],
  categoryIds: string[]
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in',
      };
    }

    if (briefIds.length === 0 || categoryIds.length === 0) {
      return {
        success: false,
        error: 'No briefs or categories selected',
      };
    }

    // Verify ownership
    const briefs = await prisma.brief.findMany({
      where: {
        id: { in: briefIds },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const unauthorizedBriefs = briefs.filter((b) => b.userId !== session.user.id);

    if (unauthorizedBriefs.length > 0) {
      return {
        success: false,
        error: `You are not authorized to modify ${unauthorizedBriefs.length} of the selected briefs`,
      };
    }

    // Add categories to all briefs
    const results = await Promise.all(
      briefIds.map((briefId) =>
        prisma.brief.update({
          where: { id: briefId },
          data: {
            categories: {
              connect: categoryIds.map((id) => ({ id })),
            },
          },
        })
      )
    );

    revalidatePath('/dashboard/briefs');
    revalidatePath('/briefs');

    return {
      success: true,
      data: {
        count: results.length,
      },
    };
  } catch (error) {
    console.error('[Bulk] Failed to add categories:', error);
    return {
      success: false,
      error: 'Failed to add categories',
    };
  }
}

/**
 * Get bulk operation summary
 */
export async function getBulkOperationSummary(briefIds: string[]) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in',
      };
    }

    const briefs = await prisma.brief.findMany({
      where: {
        id: { in: briefIds },
      },
      select: {
        id: true,
        userId: true,
        isDraft: true,
        published: true,
      },
    });

    const ownedBriefs = briefs.filter((b) => b.userId === session.user.id);
    const drafts = ownedBriefs.filter((b) => b.isDraft);
    const published = ownedBriefs.filter((b) => !b.isDraft && b.published);
    const unpublished = ownedBriefs.filter((b) => !b.isDraft && !b.published);

    return {
      success: true,
      data: {
        total: briefIds.length,
        owned: ownedBriefs.length,
        unauthorized: briefIds.length - ownedBriefs.length,
        drafts: drafts.length,
        published: published.length,
        unpublished: unpublished.length,
      },
    };
  } catch (error) {
    console.error('[Bulk] Failed to get summary:', error);
    return {
      success: false,
      error: 'Failed to get summary',
    };
  }
}
