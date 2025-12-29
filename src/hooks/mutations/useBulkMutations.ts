'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkDeleteBriefs,
  bulkPublishDrafts,
  bulkUpdateVisibility,
  bulkAddCategories,
} from '@/server/actions/briefs/bulk';
import { useRouter } from 'next/navigation';

/**
 * Bulk delete briefs
 */
export function useBulkDeleteBriefs() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (briefIds: string[]) => {
      const result = await bulkDeleteBriefs(briefIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete briefs');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['userBriefs'] });

      router.refresh();
    },
  });
}

/**
 * Bulk publish drafts
 */
export function useBulkPublishDrafts() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (draftIds: string[]) => {
      const result = await bulkPublishDrafts(draftIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to publish drafts');
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });

      router.refresh();
    },
  });
}

/**
 * Bulk update visibility
 */
export function useBulkUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      briefIds,
      isPublic,
    }: {
      briefIds: string[];
      isPublic: boolean;
    }) => {
      const result = await bulkUpdateVisibility(briefIds, isPublic);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update visibility');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['userBriefs'] });
    },
  });
}

/**
 * Bulk add categories
 */
export function useBulkAddCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      briefIds,
      categoryIds,
    }: {
      briefIds: string[];
      categoryIds: string[];
    }) => {
      const result = await bulkAddCategories(briefIds, categoryIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to add categories');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['userBriefs'] });
    },
  });
}
