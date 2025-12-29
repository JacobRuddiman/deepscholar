'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserReputation,
  awardReputationPoints,
  updateActivityCounter,
  updateActivityStreak,
  getUserBadges,
  getLeaderboard,
  getReputationHistory,
  REPUTATION_VALUES,
} from '@/server/actions/reputation/reputation';
import { toast } from 'sonner';

/**
 * Get user reputation
 */
export function useReputation(userId?: string) {
  return useQuery({
    queryKey: ['reputation', userId],
    queryFn: async () => {
      const result = await getUserReputation(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Award reputation points
 */
export function useAwardPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      action: keyof typeof REPUTATION_VALUES;
      reason?: string;
      relatedId?: string;
    }) => {
      const result = await awardReputationPoints(
        params.userId,
        params.action,
        params.reason,
        params.relatedId
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate reputation queries
      queryClient.invalidateQueries({ queryKey: ['reputation', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['badges', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['reputation-history', variables.userId] });

      // Show level up notification
      if (data?.levelUp) {
        toast.success(`Level Up! You're now ${data.newRank} (Level ${data.newLevel})`, {
          description: `+${data.pointsAdded} points`,
        });
      }
    },
  });
}

/**
 * Update activity counter
 */
export function useUpdateActivityCounter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      counter: 'briefsPublished' | 'reviewsWritten' | 'upvotesReceived' | 'helpfulReviews' | 'followersCount';
      increment?: number;
    }) => {
      const result = await updateActivityCounter(
        params.userId,
        params.counter,
        params.increment
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reputation', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['badges', variables.userId] });
    },
  });
}

/**
 * Update activity streak
 */
export function useUpdateActivityStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await updateActivityStreak(userId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['reputation', userId] });
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });

      // Show streak notification
      if (data && data.currentStreak > 1) {
        toast.success(`${data.currentStreak} day streak! 🔥`, {
          description: 'Keep up the great work!',
        });
      }
    },
  });
}

/**
 * Get user badges
 */
export function useUserBadges(userId?: string) {
  return useQuery({
    queryKey: ['badges', userId],
    queryFn: async () => {
      const result = await getUserBadges(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get leaderboard
 */
export function useLeaderboard(options?: {
  limit?: number;
  timeframe?: 'all' | 'month' | 'week';
}) {
  return useQuery({
    queryKey: ['leaderboard', options?.timeframe || 'all', options?.limit || 10],
    queryFn: async () => {
      const result = await getLeaderboard(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get reputation history
 */
export function useReputationHistory(
  userId?: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return useQuery({
    queryKey: ['reputation-history', userId, options?.limit || 20, options?.offset || 0],
    queryFn: async () => {
      const result = await getReputationHistory(userId, options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Helper: Award points for brief published
 */
export function useAwardBriefPublished() {
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (params: { userId: string; briefId: string; briefTitle: string }) => {
      return awardPoints.mutateAsync({
        userId: params.userId,
        action: 'BRIEF_PUBLISHED',
        reason: `Published: ${params.briefTitle}`,
        relatedId: params.briefId,
      });
    },
  });
}

/**
 * Helper: Award points for upvote received
 */
export function useAwardUpvoteReceived() {
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (params: { userId: string; briefId: string }) => {
      return awardPoints.mutateAsync({
        userId: params.userId,
        action: 'BRIEF_UPVOTE_RECEIVED',
        reason: 'Received upvote on brief',
        relatedId: params.briefId,
      });
    },
  });
}

/**
 * Helper: Award points for review written
 */
export function useAwardReviewWritten() {
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (params: { userId: string; reviewId: string; briefTitle: string }) => {
      return awardPoints.mutateAsync({
        userId: params.userId,
        action: 'REVIEW_WRITTEN',
        reason: `Reviewed: ${params.briefTitle}`,
        relatedId: params.reviewId,
      });
    },
  });
}

/**
 * Helper: Award points for review marked helpful
 */
export function useAwardReviewHelpful() {
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (params: { userId: string; reviewId: string }) => {
      return awardPoints.mutateAsync({
        userId: params.userId,
        action: 'REVIEW_HELPFUL',
        reason: 'Review marked as helpful',
        relatedId: params.reviewId,
      });
    },
  });
}

/**
 * Helper: Award points for follower gained
 */
export function useAwardFollowerGained() {
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (params: { userId: string; followerId: string }) => {
      return awardPoints.mutateAsync({
        userId: params.userId,
        action: 'FOLLOWER_GAINED',
        reason: 'Gained a follower',
        relatedId: params.followerId,
      });
    },
  });
}
