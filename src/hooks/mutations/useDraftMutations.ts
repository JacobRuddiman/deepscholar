'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDraft,
  updateDraft,
  publishDraft,
  deleteDraft,
  duplicateAsDraft,
  autoSaveDraft,
} from '@/server/actions/briefs/drafts';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * React Query mutations for draft operations
 */

/**
 * Create a new draft
 */
export function useCreateDraft() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createDraft(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create draft');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate drafts list
      queryClient.invalidateQueries({ queryKey: ['drafts'] });

      // Navigate to the draft editor
      router.push(`/dashboard/drafts/${data.id}`);
    },
  });
}

/**
 * Update a draft
 */
export function useUpdateDraft(draftId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: any) => {
      const result = await updateDraft(draftId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update draft');
      }
      return result.data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['draft', draftId] });

      // Snapshot the previous value
      const previousDraft = queryClient.getQueryData(['draft', draftId]);

      // Optimistically update the cache
      queryClient.setQueryData(['draft', draftId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousDraft };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDraft) {
        queryClient.setQueryData(['draft', draftId], context.previousDraft);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['draft', draftId] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

/**
 * Auto-save draft (debounced)
 */
export function useAutoSaveDraft(draftId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (updates: any) => {
      const result = await autoSaveDraft(draftId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to auto-save draft');
      }
      return result.data;
    },
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['draft', draftId] });
      const previousDraft = queryClient.getQueryData(['draft', draftId]);

      queryClient.setQueryData(['draft', draftId], (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousDraft };
    },
    onError: (err, variables, context) => {
      if (context?.previousDraft) {
        queryClient.setQueryData(['draft', draftId], context.previousDraft);
      }
    },
    onSuccess: () => {
      // Don't invalidate on auto-save to avoid disrupting user input
      // Just update the cache silently
    },
  });

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (updates: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          mutation.mutate(updates);
        }, 1000); // 1 second debounce
      };
    })(),
    [mutation]
  );

  return {
    autoSave: debouncedAutoSave,
    isAutoSaving: mutation.isPending,
    autoSaveError: mutation.error,
  };
}

/**
 * Publish a draft
 */
export function usePublishDraft() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const result = await publishDraft(draftId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to publish draft');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['brief', data.id] });

      // Navigate to the published brief
      if (data.slug) {
        router.push(`/briefs/${data.slug}`);
      } else {
        router.push(`/briefs/${data.id}`);
      }
    },
  });
}

/**
 * Delete a draft
 */
export function useDeleteDraft() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const result = await deleteDraft(draftId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete draft');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate drafts list
      queryClient.invalidateQueries({ queryKey: ['drafts'] });

      // Navigate back to drafts list
      router.push('/dashboard/drafts');
    },
  });
}

/**
 * Duplicate a brief as a draft
 */
export function useDuplicateAsDraft() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await duplicateAsDraft(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate brief');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate drafts list
      queryClient.invalidateQueries({ queryKey: ['drafts'] });

      // Navigate to the new draft
      router.push(`/dashboard/drafts/${data.id}`);
    },
  });
}
