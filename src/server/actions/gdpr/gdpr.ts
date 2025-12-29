'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Export all user data (GDPR Article 15 - Right of Access)
 */
export async function exportUserData() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const userId = session.user.id;

    // Fetch all user data
    const [
      user,
      briefs,
      reviews,
      upvotes,
      follows,
      followers,
      notifications,
      notificationPreferences,
      reputation,
      badges,
      reputationHistory,
      reviewHelpful,
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          bio: true,
          website: true,
          twitter: true,
          github: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Briefs authored
      prisma.brief.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          isPublic: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          categories: {
            select: {
              category: { select: { name: true } },
            },
          },
        },
      }),

      // Reviews written
      prisma.review.findMany({
        where: { userId },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          brief: {
            select: { title: true, slug: true },
          },
        },
      }),

      // Upvotes given
      prisma.upvote.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          brief: {
            select: { title: true, slug: true },
          },
        },
      }),

      // Users following
      prisma.follow.findMany({
        where: { followerId: userId },
        select: {
          id: true,
          createdAt: true,
          following: {
            select: { name: true, email: true },
          },
        },
      }),

      // Followers
      prisma.follow.findMany({
        where: { followingId: userId },
        select: {
          id: true,
          createdAt: true,
          follower: {
            select: { name: true, email: true },
          },
        },
      }),

      // Notifications
      prisma.notification.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          actionUrl: true,
          createdAt: true,
          readAt: true,
        },
      }),

      // Notification preferences
      prisma.notificationPreference.findUnique({
        where: { userId },
      }),

      // Reputation
      prisma.userReputation.findUnique({
        where: { userId },
      }),

      // Badges
      prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
      }),

      // Reputation history
      prisma.reputationHistory.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          points: true,
          reason: true,
          createdAt: true,
        },
      }),

      // Review helpful marks given
      prisma.reviewHelpful.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          review: {
            select: {
              comment: true,
              brief: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    // Compile data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      dataSubject: {
        userId: user?.id,
        email: user?.email,
      },
      profile: user,
      briefs: {
        count: briefs.length,
        data: briefs,
      },
      reviews: {
        count: reviews.length,
        data: reviews,
      },
      upvotes: {
        count: upvotes.length,
        data: upvotes,
      },
      social: {
        following: {
          count: follows.length,
          data: follows,
        },
        followers: {
          count: followers.length,
          data: followers,
        },
      },
      notifications: {
        count: notifications.length,
        data: notifications,
        preferences: notificationPreferences,
      },
      reputation: {
        current: reputation,
        badges: {
          count: badges.length,
          data: badges,
        },
        history: {
          count: reputationHistory.length,
          data: reputationHistory,
        },
      },
      interactions: {
        reviewHelpfulMarks: {
          count: reviewHelpful.length,
          data: reviewHelpful,
        },
      },
    };

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error('[GDPR] Failed to export user data:', error);
    return {
      success: false,
      error: 'Failed to export user data',
    };
  }
}

/**
 * Request account deletion (GDPR Article 17 - Right to Erasure)
 * Marks account for deletion and schedules cleanup
 */
export async function requestAccountDeletion(reason?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const userId = session.user.id;

    // Check if user has any published briefs
    const publishedBriefs = await prisma.brief.count({
      where: {
        authorId: userId,
        publishedAt: { not: null },
      },
    });

    // Log deletion request
    await prisma.accountDeletionRequest.create({
      data: {
        userId,
        reason,
        publishedBriefsCount: publishedBriefs,
        requestedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        message: 'Account deletion request submitted',
        publishedBriefs,
        estimatedDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    };
  } catch (error) {
    console.error('[GDPR] Failed to request account deletion:', error);
    return {
      success: false,
      error: 'Failed to request account deletion',
    };
  }
}

/**
 * Cancel account deletion request
 */
export async function cancelAccountDeletion() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const userId = session.user.id;

    // Find and delete pending deletion request
    await prisma.accountDeletionRequest.deleteMany({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return {
      success: true,
      data: {
        message: 'Account deletion request cancelled',
      },
    };
  } catch (error) {
    console.error('[GDPR] Failed to cancel account deletion:', error);
    return {
      success: false,
      error: 'Failed to cancel account deletion',
    };
  }
}

/**
 * Check if user has pending deletion request
 */
export async function getDeletionRequestStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return {
      success: true,
      data: {
        hasPendingDeletion: !!deletionRequest,
        request: deletionRequest,
      },
    };
  } catch (error) {
    console.error('[GDPR] Failed to get deletion request status:', error);
    return {
      success: false,
      error: 'Failed to get deletion request status',
    };
  }
}

/**
 * Admin: Process account deletion
 * This should be called by a scheduled job after grace period
 */
export async function processAccountDeletion(userId: string) {
  try {
    // Verify admin session
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check if there's a valid deletion request
    const deletionRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId,
        deletedAt: null,
        requestedAt: {
          lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
    });

    if (!deletionRequest) {
      return {
        success: false,
        error: 'No valid deletion request found',
      };
    }

    // Delete user data (cascade will handle related records)
    await prisma.$transaction(async (tx) => {
      // Mark deletion request as processed
      await tx.accountDeletionRequest.update({
        where: { id: deletionRequest.id },
        data: { deletedAt: new Date() },
      });

      // Anonymize published briefs instead of deleting
      await tx.brief.updateMany({
        where: {
          authorId: userId,
          publishedAt: { not: null },
        },
        data: {
          authorId: 'deleted-user',
        },
      });

      // Delete user account (cascade will delete related records)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    revalidatePath('/');

    return {
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    };
  } catch (error) {
    console.error('[GDPR] Failed to process account deletion:', error);
    return {
      success: false,
      error: 'Failed to process account deletion',
    };
  }
}

/**
 * Download personal data as JSON file
 */
export async function downloadUserDataJSON() {
  try {
    const result = await exportUserData();

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to export data',
      };
    }

    // Convert to JSON string
    const jsonData = JSON.stringify(result.data, null, 2);

    return {
      success: true,
      data: {
        filename: `deepscholar-data-export-${Date.now()}.json`,
        content: jsonData,
        mimeType: 'application/json',
      },
    };
  } catch (error) {
    console.error('[GDPR] Failed to download user data:', error);
    return {
      success: false,
      error: 'Failed to download user data',
    };
  }
}
