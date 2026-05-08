// @ts-nocheck - Prisma models not yet in schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Reputation point values for different actions
 */
export const REPUTATION_VALUES = {
  BRIEF_PUBLISHED: 10,
  BRIEF_UPVOTE_RECEIVED: 5,
  REVIEW_WRITTEN: 3,
  REVIEW_HELPFUL: 5,
  FOLLOWER_GAINED: 2,
  BRIEF_FEATURED: 50,
  DAILY_LOGIN: 1,
} as const;

/**
 * Ranks based on reputation points
 */
const RANKS = [
  { minPoints: 0, name: 'Beginner', level: 1 },
  { minPoints: 50, name: 'Novice', level: 2 },
  { minPoints: 150, name: 'Contributor', level: 3 },
  { minPoints: 300, name: 'Regular', level: 4 },
  { minPoints: 500, name: 'Established', level: 5 },
  { minPoints: 800, name: 'Trusted', level: 6 },
  { minPoints: 1200, name: 'Expert', level: 7 },
  { minPoints: 1800, name: 'Master', level: 8 },
  { minPoints: 2500, name: 'Legend', level: 9 },
  { minPoints: 5000, name: 'Icon', level: 10 },
];

/**
 * Calculate rank from points
 */
function calculateRank(points: number): { rank: string; level: number } {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) {
      return { rank: RANKS[i].name, level: RANKS[i].level };
    }
  }
  return { rank: 'Beginner', level: 1 };
}

/**
 * Get or create user reputation
 */
export async function getUserReputation(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    let reputation = await prisma.userReputation.findUnique({
      where: { userId: targetUserId },
    });

    // Create if doesn't exist
    if (!reputation) {
      reputation = await prisma.userReputation.create({
        data: {
          userId: targetUserId,
          points: 0,
          level: 1,
          rank: 'Beginner',
        },
      });
    }

    return {
      success: true,
      data: reputation,
    };
  } catch (error) {
    console.error('[Reputation] Failed to get reputation:', error);
    return {
      success: false,
      error: 'Failed to get reputation',
    };
  }
}

/**
 * Award reputation points
 * SECURITY: Requires authentication. Only awards to the specified user
 * when called from other trusted server actions.
 */
export async function awardReputationPoints(
  userId: string,
  action: keyof typeof REPUTATION_VALUES,
  reason?: string,
  relatedId?: string
) {
  try {
    // SECURITY: Verify caller is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const points = REPUTATION_VALUES[action];

    // Get or create reputation
    let reputation = await prisma.userReputation.findUnique({
      where: { userId },
    });

    if (!reputation) {
      reputation = await prisma.userReputation.create({
        data: { userId, points: 0, level: 1, rank: 'Beginner' },
      });
    }

    // Calculate new points and rank
    const newPoints = reputation.points + points;
    const { rank, level } = calculateRank(newPoints);

    // Update reputation
    const updated = await prisma.userReputation.update({
      where: { userId },
      data: {
        points: newPoints,
        level,
        rank,
        updatedAt: new Date(),
      },
    });

    // Create history entry
    await prisma.reputationHistory.create({
      data: {
        userId,
        action,
        points,
        reason,
        relatedId,
      },
    });

    // Check for new badges
    await checkAndAwardBadges(userId);

    revalidatePath('/profile');

    return {
      success: true,
      data: {
        previousPoints: reputation.points,
        newPoints: updated.points,
        pointsAdded: points,
        levelUp: updated.level > reputation.level,
        newLevel: updated.level,
        newRank: updated.rank,
      },
    };
  } catch (error) {
    console.error('[Reputation] Failed to award points:', error);
    return {
      success: false,
      error: 'Failed to award reputation points',
    };
  }
}

/**
 * Update activity counters
 * SECURITY: Requires authentication.
 */
export async function updateActivityCounter(
  userId: string,
  counter: 'briefsPublished' | 'reviewsWritten' | 'upvotesReceived' | 'helpfulReviews' | 'followersCount',
  increment: number = 1
) {
  try {
    // SECURITY: Verify caller is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const reputation = await prisma.userReputation.upsert({
      where: { userId },
      update: {
        [counter]: { increment },
        updatedAt: new Date(),
      },
      create: {
        userId,
        [counter]: increment,
      },
    });

    // Check for new badges after counter update
    await checkAndAwardBadges(userId);

    return {
      success: true,
      data: reputation,
    };
  } catch (error) {
    console.error('[Reputation] Failed to update counter:', error);
    return {
      success: false,
      error: 'Failed to update activity counter',
    };
  }
}

/**
 * Update activity streak
 * SECURITY: Requires authentication.
 */
export async function updateActivityStreak(userId: string) {
  try {
    // SECURITY: Verify caller is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const reputation = await prisma.userReputation.findUnique({
      where: { userId },
    });

    if (!reputation) {
      return {
        success: false,
        error: 'Reputation not found',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = reputation.lastActivityDate
      ? new Date(reputation.lastActivityDate)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStreak = reputation.currentStreak;

      if (daysDiff === 0) {
        // Same day - no change
        return { success: true, data: reputation };
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak = reputation.currentStreak + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }

      const updated = await prisma.userReputation.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, reputation.longestStreak),
          lastActivityDate: new Date(),
        },
      });

      // Award daily login bonus
      await awardReputationPoints(userId, 'DAILY_LOGIN', 'Daily login bonus');

      // Check for streak badges
      await checkAndAwardBadges(userId);

      return {
        success: true,
        data: updated,
      };
    } else {
      // First activity
      const updated = await prisma.userReputation.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
        },
      });

      return {
        success: true,
        data: updated,
      };
    }
  } catch (error) {
    console.error('[Reputation] Failed to update streak:', error);
    return {
      success: false,
      error: 'Failed to update activity streak',
    };
  }
}

/**
 * Check and award badges
 */
async function checkAndAwardBadges(userId: string) {
  try {
    const reputation = await prisma.userReputation.findUnique({
      where: { userId },
    });

    if (!reputation) return;

    // Get all badges user doesn't have yet
    const userBadgeIds = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const ownedBadgeIds = userBadgeIds.map((ub) => ub.badgeId);

    const availableBadges = await prisma.badge.findMany({
      where: {
        id: { notIn: ownedBadgeIds },
      },
    });

    // Check each badge requirement
    for (const badge of availableBadges) {
      let earned = false;

      if (badge.requiredAction && badge.requiredCount) {
        switch (badge.requiredAction) {
          case 'brief_published':
            earned = reputation.briefsPublished >= badge.requiredCount;
            break;
          case 'review_written':
            earned = reputation.reviewsWritten >= badge.requiredCount;
            break;
          case 'upvotes_received':
            earned = reputation.upvotesReceived >= badge.requiredCount;
            break;
          case 'helpful_reviews':
            earned = reputation.helpfulReviews >= badge.requiredCount;
            break;
          case 'followers_count':
            earned = reputation.followersCount >= badge.requiredCount;
            break;
          case 'current_streak':
            earned = reputation.currentStreak >= badge.requiredCount;
            break;
        }
      } else if (badge.requiredPoints) {
        earned = reputation.points >= badge.requiredPoints;
      }

      if (earned) {
        // Award badge
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });

        // TODO: Send notification about new badge
      }
    }
  } catch (error) {
    console.error('[Reputation] Failed to check badges:', error);
  }
}

/**
 * Get user badges
 */
export async function getUserBadges(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: targetUserId },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    });

    return {
      success: true,
      data: userBadges,
    };
  } catch (error) {
    console.error('[Reputation] Failed to get badges:', error);
    return {
      success: false,
      error: 'Failed to get badges',
    };
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(options?: {
  limit?: number;
  timeframe?: 'all' | 'month' | 'week';
}) {
  try {
    const { limit = 10, timeframe = 'all' } = options || {};

    if (timeframe === 'all') {
      // All-time leaderboard
      const leaders = await prisma.userReputation.findMany({
        take: limit,
        orderBy: {
          points: 'desc',
        },
        include: {
          user: {
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
        data: leaders,
      };
    } else {
      // Time-based leaderboard (monthly/weekly)
      const startDate = new Date();
      if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      }

      // Aggregate points from history
      const leaders = await prisma.reputationHistory.groupBy({
        by: ['userId'],
        _sum: {
          points: true,
        },
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: limit,
      });

      // Fetch user details
      const leaderboardWithUsers = await Promise.all(
        leaders.map(async (leader) => {
          const user = await prisma.user.findUnique({
            where: { id: leader.userId },
            select: {
              id: true,
              name: true,
              image: true,
            },
          });

          const reputation = await prisma.userReputation.findUnique({
            where: { userId: leader.userId },
          });

          return {
            userId: leader.userId,
            user,
            points: leader._sum.points || 0,
            reputation,
          };
        })
      );

      return {
        success: true,
        data: leaderboardWithUsers,
      };
    }
  } catch (error) {
    console.error('[Reputation] Failed to get leaderboard:', error);
    return {
      success: false,
      error: 'Failed to get leaderboard',
    };
  }
}

/**
 * Get reputation history
 */
export async function getReputationHistory(userId?: string, options?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const { limit = 20, offset = 0 } = options || {};

    const [history, total] = await Promise.all([
      prisma.reputationHistory.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.reputationHistory.count({
        where: { userId: targetUserId },
      }),
    ]);

    return {
      success: true,
      data: {
        history,
        total,
        hasMore: offset + history.length < total,
      },
    };
  } catch (error) {
    console.error('[Reputation] Failed to get history:', error);
    return {
      success: false,
      error: 'Failed to get reputation history',
    };
  }
}
