'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'follow' | 'review' | 'upvote' | 'publish' | 'mention' | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Check if user has in-app notifications enabled for this type
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: params.userId },
    });

    const preferenceKey = `inApp${params.type.charAt(0).toUpperCase() + params.type.slice(1)}` as keyof typeof preferences;

    // Skip if user has disabled this notification type
    if (preferences && preferenceKey in preferences && !preferences[preferenceKey]) {
      return { success: true, data: null }; // Silently skip
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        relatedId: params.relatedId,
      },
    });

    revalidatePath('/notifications');

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error('[Notifications] Failed to create notification:', error);
    return {
      success: false,
      error: 'Failed to create notification',
    };
  }
}

/**
 * Get user notifications (paginated)
 */
export async function getUserNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const { limit = 20, offset = 0, unreadOnly = false } = options || {};

    const where = {
      userId: session.user.id,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        total,
        hasMore: offset + notifications.length < total,
      },
    };
  } catch (error) {
    console.error('[Notifications] Failed to fetch notifications:', error);
    return {
      success: false,
      error: 'Failed to fetch notifications',
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification || notification.userId !== session.user.id) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Notifications] Failed to mark as read:', error);
    return {
      success: false,
      error: 'Failed to mark notification as read',
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Notifications] Failed to mark all as read:', error);
    return {
      success: false,
      error: 'Failed to mark all notifications as read',
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification || notification.userId !== session.user.id) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath('/notifications');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Notifications] Failed to delete notification:', error);
    return {
      success: false,
      error: 'Failed to delete notification',
    };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error('[Notifications] Failed to get unread count:', error);
    return {
      success: false,
      error: 'Failed to get unread count',
    };
  }
}

/**
 * Get or create user notification preferences
 */
export async function getNotificationPreferences() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return {
      success: true,
      data: preferences,
    };
  } catch (error) {
    console.error('[Notifications] Failed to get preferences:', error);
    return {
      success: false,
      error: 'Failed to get notification preferences',
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: Partial<{
  inAppNewFollow: boolean;
  inAppNewReview: boolean;
  inAppNewUpvote: boolean;
  inAppBriefPublished: boolean;
  inAppMention: boolean;
  emailNewFollow: boolean;
  emailNewReview: boolean;
  emailNewUpvote: boolean;
  emailBriefPublished: boolean;
  emailMention: boolean;
  emailDigest: boolean;
  emailDigestFrequency: string;
}>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: preferences,
      create: {
        userId: session.user.id,
        ...preferences,
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error('[Notifications] Failed to update preferences:', error);
    return {
      success: false,
      error: 'Failed to update notification preferences',
    };
  }
}

/**
 * Helper: Create notification when someone follows you
 */
export async function notifyNewFollower(followerId: string, followingId: string) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { name: true },
  });

  if (!follower) return;

  await createNotification({
    userId: followingId,
    type: 'follow',
    title: 'New Follower',
    message: `${follower.name} started following you`,
    actionUrl: `/users/${followerId}`,
    relatedId: followerId,
  });
}

/**
 * Helper: Create notification when someone reviews your brief
 */
export async function notifyNewReview(briefId: string, reviewerId: string, briefAuthorId: string) {
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { name: true },
  });

  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { title: true, slug: true },
  });

  if (!reviewer || !brief) return;

  await createNotification({
    userId: briefAuthorId,
    type: 'review',
    title: 'New Review',
    message: `${reviewer.name} reviewed your brief "${brief.title}"`,
    actionUrl: `/briefs/${brief.slug}`,
    relatedId: briefId,
  });
}

/**
 * Helper: Create notification when someone upvotes your brief
 */
export async function notifyNewUpvote(briefId: string, upvoterId: string, briefAuthorId: string) {
  const upvoter = await prisma.user.findUnique({
    where: { id: upvoterId },
    select: { name: true },
  });

  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { title: true, slug: true },
  });

  if (!upvoter || !brief) return;

  await createNotification({
    userId: briefAuthorId,
    type: 'upvote',
    title: 'New Upvote',
    message: `${upvoter.name} upvoted your brief "${brief.title}"`,
    actionUrl: `/briefs/${brief.slug}`,
    relatedId: briefId,
  });
}
