// @ts-nocheck - Prisma models not yet in schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Schedule a brief for future publication
 */
export async function scheduleBriefPublication(
  briefId: string,
  scheduledFor: Date
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify brief exists and user owns it
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { id: true, userId: true, publishedAt: true },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    if (brief.userId !== session.user.id) {
      return {
        success: false,
        error: 'You do not own this brief',
      };
    }

    if (brief.publishedAt) {
      return {
        success: false,
        error: 'Brief is already published',
      };
    }

    // Validate scheduled time is in future
    if (scheduledFor <= new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      };
    }

    // Create or update scheduled publication
    await prisma.scheduledPublication.upsert({
      where: { briefId },
      update: {
        scheduledFor,
        status: 'pending',
        updatedAt: new Date(),
      },
      create: {
        briefId,
        scheduledFor,
        status: 'pending',
      },
    });

    // Update brief with scheduled time
    await prisma.brief.update({
      where: { id: briefId },
      data: { scheduledFor },
    });

    revalidatePath('/dashboard/drafts');
    revalidatePath(`/dashboard/drafts/${briefId}`);

    return {
      success: true,
      data: {
        message: 'Brief scheduled for publication',
        scheduledFor,
      },
    };
  } catch (error) {
    console.error('[Scheduling] Failed to schedule publication:', error);
    return {
      success: false,
      error: 'Failed to schedule publication',
    };
  }
}

/**
 * Cancel scheduled publication
 */
export async function cancelScheduledPublication(briefId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify brief exists and user owns it
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { id: true, userId: true },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    if (brief.userId !== session.user.id) {
      return {
        success: false,
        error: 'You do not own this brief',
      };
    }

    // Update scheduled publication status
    await prisma.scheduledPublication.update({
      where: { briefId },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    // Remove scheduled time from brief
    await prisma.brief.update({
      where: { id: briefId },
      data: { scheduledFor: null },
    });

    revalidatePath('/dashboard/drafts');
    revalidatePath(`/dashboard/drafts/${briefId}`);

    return {
      success: true,
      data: {
        message: 'Scheduled publication cancelled',
      },
    };
  } catch (error) {
    console.error('[Scheduling] Failed to cancel publication:', error);
    return {
      success: false,
      error: 'Failed to cancel scheduled publication',
    };
  }
}

/**
 * Get scheduled publications for user
 */
export async function getScheduledPublications(options?: {
  status?: 'pending' | 'published' | 'failed' | 'cancelled';
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const { status, limit = 20, offset = 0 } = options || {};

    const where: any = {
      brief: {
        userId: session.user.id,
      },
    };

    if (status) {
      where.status = status;
    }

    const [scheduled, total] = await Promise.all([
      prisma.scheduledPublication.findMany({
        where,
        include: {
          brief: {
            select: {
              id: true,
              title: true,
              slug: true,
              createdAt: true,
            },
          },
        },
        orderBy: { scheduledFor: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.scheduledPublication.count({ where }),
    ]);

    return {
      success: true,
      data: {
        scheduled,
        total,
        hasMore: offset + scheduled.length < total,
      },
    };
  } catch (error) {
    console.error('[Scheduling] Failed to get scheduled publications:', error);
    return {
      success: false,
      error: 'Failed to get scheduled publications',
    };
  }
}

/**
 * Process scheduled publications (called by cron job)
 */
export async function processScheduledPublications() {
  try {
    const now = new Date();

    // Find all pending publications that are due
    const duePublications = await prisma.scheduledPublication.findMany({
      where: {
        status: 'pending',
        scheduledFor: { lte: now },
      },
      include: {
        brief: true,
      },
      take: 50, // Process max 50 at a time
    });

    const results = [];

    for (const scheduled of duePublications) {
      try {
        // Publish the brief
        await prisma.brief.update({
          where: { id: scheduled.briefId },
          data: {
            publishedAt: now,
            isPublic: true,
            publishedBy: 'scheduler',
          },
        });

        // Mark as published
        await prisma.scheduledPublication.update({
          where: { id: scheduled.id },
          data: {
            status: 'published',
            updatedAt: now,
          },
        });

        results.push({
          briefId: scheduled.briefId,
          status: 'published',
        });

        // Award reputation points for publishing
        // (Assuming you have reputation system)
        /*
        await awardReputationPoints(
          scheduled.brief.userId,
          'BRIEF_PUBLISHED',
          `Scheduled publication: ${scheduled.brief.title}`,
          scheduled.briefId
        );
        */

        revalidatePath('/briefs');
        revalidatePath(`/briefs/${scheduled.brief.slug}`);
      } catch (error) {
        console.error(`[Scheduling] Failed to publish brief ${scheduled.briefId}:`, error);

        // Mark as failed and record error
        await prisma.scheduledPublication.update({
          where: { id: scheduled.id },
          data: {
            status: scheduled.attempts >= 2 ? 'failed' : 'pending',
            attempts: { increment: 1 },
            lastAttemptAt: now,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: now,
          },
        });

        results.push({
          briefId: scheduled.briefId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      data: {
        processed: results.length,
        results,
      },
    };
  } catch (error) {
    console.error('[Scheduling] Failed to process scheduled publications:', error);
    return {
      success: false,
      error: 'Failed to process scheduled publications',
    };
  }
}

/**
 * Reschedule failed publication
 */
export async function reschedulePublication(
  briefId: string,
  newScheduledTime: Date
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify brief exists and user owns it
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { id: true, userId: true },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    if (brief.userId !== session.user.id) {
      return {
        success: false,
        error: 'You do not own this brief',
      };
    }

    // Update scheduled publication
    await prisma.scheduledPublication.update({
      where: { briefId },
      data: {
        scheduledFor: newScheduledTime,
        status: 'pending',
        attempts: 0,
        errorMessage: null,
        updatedAt: new Date(),
      },
    });

    // Update brief
    await prisma.brief.update({
      where: { id: briefId },
      data: { scheduledFor: newScheduledTime },
    });

    revalidatePath('/dashboard/drafts');

    return {
      success: true,
      data: {
        message: 'Publication rescheduled',
        scheduledFor: newScheduledTime,
      },
    };
  } catch (error) {
    console.error('[Scheduling] Failed to reschedule:', error);
    return {
      success: false,
      error: 'Failed to reschedule publication',
    };
  }
}
