'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/server/actions/notifications/notifications';

/**
 * Extract mentions from text (@username)
 */
function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Create mentions and send notifications
 */
export async function createMentions(
  contentType: 'review' | 'comment' | 'brief',
  contentId: string,
  text: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const usernames = extractMentions(text);
    if (usernames.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    // Find mentioned users
    const users = await prisma.user.findMany({
      where: {
        name: { in: usernames },
      },
      select: { id: true, name: true },
    });

    // Create mentions
    const mentions = await Promise.all(
      users.map((user) =>
        prisma.mention.create({
          data: {
            mentionedUserId: user.id,
            mentionerId: session.user.id,
            contentType,
            contentId,
            content: text.substring(0, 200), // Store first 200 chars
          },
        })
      )
    );

    // Send notifications to mentioned users (don't notify yourself)
    const mentionedOthers = users.filter((user) => user.id !== session.user.id);
    await Promise.all(
      mentionedOthers.map((user) =>
        createNotification({
          userId: user.id,
          type: 'mention',
          title: 'You were mentioned',
          message: `${session.user.name ?? 'Someone'} mentioned you in a ${contentType}`,
          actionUrl: contentType === 'brief' ? `/briefs/${contentId}` : undefined,
          relatedId: contentId,
        }).catch((err) =>
          console.error('[Mentions] Notification failed:', String(err))
        )
      )
    );

    return {
      success: true,
      data: { count: mentions.length },
    };
  } catch (error) {
    console.error('[Mentions] Failed to create mentions:', error);
    return { success: false, error: 'Failed to create mentions' };
  }
}

/**
 * Get mentions for a user
 */
export async function getUserMentions(options?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { limit = 20, offset = 0 } = options || {};

    const [mentions, total] = await Promise.all([
      prisma.mention.findMany({
        where: { mentionedUserId: session.user.id },
        include: {
          mentioner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.mention.count({
        where: { mentionedUserId: session.user.id },
      }),
    ]);

    return {
      success: true,
      data: {
        mentions,
        total,
        hasMore: offset + mentions.length < total,
      },
    };
  } catch (error) {
    console.error('[Mentions] Failed to get mentions:', error);
    return { success: false, error: 'Failed to get mentions' };
  }
}

/**
 * Search users for mentions autocomplete
 */
export async function searchUsersForMention(query: string, limit = 10) {
  try {
    if (query.length < 2) {
      return { success: true, data: [] };
    }

    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: limit,
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('[Mentions] Failed to search users:', error);
    return { success: false, error: 'Failed to search users' };
  }
}
