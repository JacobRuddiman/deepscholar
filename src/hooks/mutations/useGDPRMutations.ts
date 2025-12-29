'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionRequestStatus,
  downloadUserDataJSON,
} from '@/server/actions/gdpr/gdpr';
import { toast } from 'sonner';

/**
 * Export user data
 */
export function useExportUserData() {
  return useMutation({
    mutationFn: async () => {
      const result = await exportUserData();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Data export completed', {
        description: 'Your data has been prepared for download',
      });
    },
    onError: (error: Error) => {
      toast.error('Export failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Download user data as JSON file
 */
export function useDownloadUserData() {
  return useMutation({
    mutationFn: async () => {
      const result = await downloadUserDataJSON();

      if (!result.success || !result.data) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Create blob and trigger download
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download started', {
        description: 'Your data export is being downloaded',
      });
    },
    onError: (error: Error) => {
      toast.error('Download failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Request account deletion
 */
export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason?: string) => {
      const result = await requestAccountDeletion(reason);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request-status'] });

      toast.success('Deletion request submitted', {
        description: `Your account will be deleted after ${data?.publishedBriefs ? '30 days' : '7 days'} grace period`,
      });
    },
    onError: (error: Error) => {
      toast.error('Request failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Cancel account deletion request
 */
export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await cancelAccountDeletion();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request-status'] });

      toast.success('Deletion cancelled', {
        description: 'Your account deletion request has been cancelled',
      });
    },
    onError: (error: Error) => {
      toast.error('Cancellation failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Get deletion request status
 */
export function useDeletionRequestStatus() {
  return useQuery({
    queryKey: ['deletion-request-status'],
    queryFn: async () => {
      const result = await getDeletionRequestStatus();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
