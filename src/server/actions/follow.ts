// @ts-nocheck - Follow model not yet in Prisma schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notifyNewFollower } from '@/server/actions/notifications/notifications';

/**
 * Server actions for user following system
 */

/**
 * Follow a user
 */
export async function followUser(userIdToFollow: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in to follow users',
      };
    }

    if (session.user.id === userIdToFollow) {
      return {
        success: false,
        error: 'You cannot follow yourself',
      };
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userIdToFollow },
    });

    if (!userExists) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userIdToFollow,
        },
      },
    });

    if (existingFollow) {
      return {
        success: false,
        error: 'You are already following this user',
      };
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userIdToFollow,
      },
    });

    // Notify the followed user (fire-and-forget, don't block the response)
    notifyNewFollower(session.user.id, userIdToFollow).catch((err) =>
      console.error('[Follow] Notification failed:', String(err))
    );

    // Revalidate paths
    revalidatePath(`/users/${userIdToFollow}`);
    revalidatePath(`/users/${session.user.id}`);
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Follow] Failed to follow user:', error);
    return {
      success: false,
      error: 'Failed to follow user',
    };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userIdToUnfollow: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in to unfollow users',
      };
    }

    // Delete follow relationship
    const result = await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userIdToUnfollow,
      },
    });

    if (result.count === 0) {
      return {
        success: false,
        error: 'You are not following this user',
      };
    }

    // Revalidate paths
    revalidatePath(`/users/${userIdToUnfollow}`);
    revalidatePath(`/users/${session.user.id}`);
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Follow] Failed to unfollow user:', error);
    return {
      success: false,
      error: 'Failed to unfollow user',
    };
  }
}

/**
 * Check if current user is following another user
 */
export async function isFollowing(userId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: true,
        data: false,
      };
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    return {
      success: true,
      data: !!follow,
    };
  } catch (error) {
    console.error('[Follow] Failed to check follow status:', error);
    return {
      success: false,
      error: 'Failed to check follow status',
    };
  }
}

/**
 * Get user's followers
 * SECURITY: Requires authentication to prevent unauthenticated enumeration.
 */
export async function getUserFollowers(userId: string, options?: { limit?: number; offset?: number }) {
  const { limit = 20, offset = 0 } = options || {};

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                briefs: true,
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.follow.count({
      where: { followingId: userId },
    });

    return {
      success: true,
      data: {
        followers: followers.map((f) => f.follower),
        total,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error('[Follow] Failed to get followers:', error);
    return {
      success: false,
      error: 'Failed to get followers',
    };
  }
}

/**
 * Get users that a user is following
 * SECURITY: Requires authentication to prevent unauthenticated enumeration.
 */
export async function getUserFollowing(userId: string, options?: { limit?: number; offset?: number }) {
  const { limit = 20, offset = 0 } = options || {};

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                briefs: true,
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      success: true,
      data: {
        following: following.map((f) => f.following),
        total,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error('[Follow] Failed to get following:', error);
    return {
      success: false,
      error: 'Failed to get following',
    };
  }
}

/**
 * Get follower/following counts for a user
 * SECURITY: Requires authentication.
 */
export async function getUserFollowCounts(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      success: true,
      data: {
        followers: followersCount,
        following: followingCount,
      },
    };
  } catch (error) {
    console.error('[Follow] Failed to get follow counts:', error);
    return {
      success: false,
      error: 'Failed to get follow counts',
    };
  }
}

/**
 * Get suggested users to follow (users you don't follow with similar interests)
 */
export async function getSuggestedUsers(limit: number = 5) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be signed in',
      };
    }

    // Get users that:
    // 1. Current user is not following
    // 2. Are not the current user
    // 3. Have created briefs
    // Ordered by number of briefs (most active first)

    const suggested = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          {
            followers: {
              none: {
                followerId: session.user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            briefs: true,
            followers: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        briefs: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return {
      success: true,
      data: suggested,
    };
  } catch (error) {
    console.error('[Follow] Failed to get suggested users:', error);
    return {
      success: false,
      error: 'Failed to get suggested users',
    };
  }
}

/**
 * Get mutual follows (users that follow each other)
 * SECURITY: Requires authentication.
 */
export async function getMutualFollows(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const mutuals = await prisma.follow.findMany({
      where: {
        followerId: userId,
        following: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                briefs: true,
                followers: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: mutuals.map((m) => m.following),
    };
  } catch (error) {
    console.error('[Follow] Failed to get mutual follows:', error);
    return {
      success: false,
      error: 'Failed to get mutual follows',
    };
  }
}
