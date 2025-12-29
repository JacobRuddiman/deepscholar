'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/server/actions/notifications/notifications';

/**
 * Get user notifications
 */
export function useNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}) {
  const { limit, offset, unreadOnly, enabled = true } = options || {};

  return useQuery({
    queryKey: ['notifications', { limit, offset, unreadOnly }],
    queryFn: async () => {
      const result = await getUserNotifications({ limit, offset, unreadOnly });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const result = await getUnreadNotificationCount();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get count');
      }
      return result.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await markNotificationAsRead(notificationId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsAsRead();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await deleteNotification(notificationId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const result = await getNotificationPreferences();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Parameters<typeof updateNotificationPreferences>[0]) => {
      const result = await updateNotificationPreferences(preferences);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });
}
