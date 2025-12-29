'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  getUserFollowCounts,
  getSuggestedUsers,
  getMutualFollows,
} from '@/server/actions/follow';

/**
 * Follow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await followUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to follow user');
      }
      return result;
    },
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['followCounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

/**
 * Unfollow a user
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await unfollowUser(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to unfollow user');
      }
      return result;
    },
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['followCounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

/**
 * Check if following a user
 */
export function useIsFollowing(userId: string) {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      const result = await isFollowing(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to check follow status');
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get user's followers
 */
export function useUserFollowers(userId: string, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['followers', userId, options],
    queryFn: async () => {
      const result = await getUserFollowers(userId, options);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get followers');
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get users that a user is following
 */
export function useUserFollowing(userId: string, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['following', userId, options],
    queryFn: async () => {
      const result = await getUserFollowing(userId, options);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get following');
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get follow counts for a user
 */
export function useFollowCounts(userId: string) {
  return useQuery({
    queryKey: ['followCounts', userId],
    queryFn: async () => {
      const result = await getUserFollowCounts(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get follow counts');
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Get suggested users to follow
 */
export function useSuggestedUsers(limit: number = 5) {
  return useQuery({
    queryKey: ['suggestedUsers', limit],
    queryFn: async () => {
      const result = await getSuggestedUsers(limit);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get suggested users');
      }
      return result.data;
    },
  });
}

/**
 * Get mutual follows
 */
export function useMutualFollows(userId: string) {
  return useQuery({
    queryKey: ['mutualFollows', userId],
    queryFn: async () => {
      const result = await getMutualFollows(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get mutual follows');
      }
      return result.data;
    },
    enabled: !!userId,
  });
}
