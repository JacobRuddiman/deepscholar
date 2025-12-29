import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleBriefUpvote, toggleBriefSave, addBriefReview, deleteBriefReview } from '@/server/actions/briefs/interactions';
import { createBrief, deleteBrief } from '@/server/actions/briefs/core-operations';
import { createBriefVersion } from '@/server/actions/briefs/versions';

/**
 * Hook for upvoting/unupvoting a brief with optimistic updates
 */
export function useUpvoteBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await toggleBriefUpvote(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle upvote');
      }
      return result;
    },

    // Optimistic update: immediately update UI before server responds
    onMutate: async (briefId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['brief', briefId] });
      await queryClient.cancelQueries({ queryKey: ['briefs'] });

      // Snapshot the previous values
      const previousBrief = queryClient.getQueryData(['brief', briefId]);
      const previousBriefs = queryClient.getQueriesData({ queryKey: ['briefs'] });

      // Optimistically update the individual brief
      queryClient.setQueryData(['brief', briefId], (old: any) => {
        if (!old) return old;
        const currentUpvoteCount = old.upvotes?.length || 0;
        const userHasUpvoted = old.userHasUpvoted || false;

        return {
          ...old,
          upvotes: userHasUpvoted
            ? old.upvotes?.filter((u: any) => u.userId !== old.currentUserId) || []
            : [...(old.upvotes || []), { userId: old.currentUserId, briefId }],
          userHasUpvoted: !userHasUpvoted,
          _count: {
            ...old._count,
            upvotes: userHasUpvoted ? currentUpvoteCount - 1 : currentUpvoteCount + 1,
          },
        };
      });

      // Optimistically update briefs in list views
      queryClient.setQueriesData({ queryKey: ['briefs'] }, (old: any) => {
        if (!old?.data?.briefs) return old;
        return {
          ...old,
          data: {
            ...old.data,
            briefs: old.data.briefs.map((brief: any) => {
              if (brief.id !== briefId) return brief;
              const currentUpvoteCount = brief._count?.upvotes || 0;
              const userHasUpvoted = brief.userHasUpvoted || false;
              return {
                ...brief,
                userHasUpvoted: !userHasUpvoted,
                _count: {
                  ...brief._count,
                  upvotes: userHasUpvoted ? currentUpvoteCount - 1 : currentUpvoteCount + 1,
                },
              };
            }),
          },
        };
      });

      return { previousBrief, previousBriefs };
    },

    // If mutation fails, roll back to previous values
    onError: (err, briefId, context) => {
      if (context?.previousBrief) {
        queryClient.setQueryData(['brief', briefId], context.previousBrief);
      }
      if (context?.previousBriefs) {
        context.previousBriefs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always refetch after error or success to sync with server
    onSettled: (data, error, briefId) => {
      queryClient.invalidateQueries({ queryKey: ['brief', briefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}

/**
 * Hook for saving/unsaving a brief with optimistic updates
 */
export function useSaveBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await toggleBriefSave(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle save');
      }
      return result;
    },

    onMutate: async (briefId) => {
      await queryClient.cancelQueries({ queryKey: ['brief', briefId] });
      await queryClient.cancelQueries({ queryKey: ['briefs'] });

      const previousBrief = queryClient.getQueryData(['brief', briefId]);
      const previousBriefs = queryClient.getQueriesData({ queryKey: ['briefs'] });

      // Optimistically update the brief
      queryClient.setQueryData(['brief', briefId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          userHasSaved: !old.userHasSaved,
        };
      });

      // Optimistically update briefs in list views
      queryClient.setQueriesData({ queryKey: ['briefs'] }, (old: any) => {
        if (!old?.data?.briefs) return old;
        return {
          ...old,
          data: {
            ...old.data,
            briefs: old.data.briefs.map((brief: any) => {
              if (brief.id !== briefId) return brief;
              return {
                ...brief,
                userHasSaved: !brief.userHasSaved,
              };
            }),
          },
        };
      });

      return { previousBrief, previousBriefs };
    },

    onError: (err, briefId, context) => {
      if (context?.previousBrief) {
        queryClient.setQueryData(['brief', briefId], context.previousBrief);
      }
      if (context?.previousBriefs) {
        context.previousBriefs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: (data, error, briefId) => {
      queryClient.invalidateQueries({ queryKey: ['brief', briefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}

/**
 * Hook for creating a new brief
 */
export function useCreateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefData: Parameters<typeof createBrief>[0]) => {
      const result = await createBrief(briefData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create brief');
      }
      return result.data;
    },

    onSuccess: () => {
      // Invalidate all brief lists to show the new brief
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/**
 * Hook for creating a new version of a brief
 */
export function useCreateBriefVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentBriefId,
      briefData,
      changeLog
    }: {
      parentBriefId: string;
      briefData: Parameters<typeof createBriefVersion>[1];
      changeLog: string;
    }) => {
      const result = await createBriefVersion(parentBriefId, briefData, changeLog);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create brief version');
      }
      return result.data;
    },

    onSuccess: (data, { parentBriefId }) => {
      // Invalidate the parent brief and its versions
      queryClient.invalidateQueries({ queryKey: ['brief', parentBriefId] });
      queryClient.invalidateQueries({ queryKey: ['briefVersions', parentBriefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}

/**
 * Hook for deleting a brief
 */
export function useDeleteBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await deleteBrief(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete brief');
      }
      return result;
    },

    onSuccess: (data, briefId) => {
      // Remove the brief from cache
      queryClient.removeQueries({ queryKey: ['brief', briefId] });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/**
 * Hook for adding a review to a brief
 */
export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ briefId, content, rating }: { briefId: string; content: string; rating: number }) => {
      const result = await addBriefReview(briefId, content, rating);
      if (!result.success) {
        throw new Error(result.error || 'Failed to add review');
      }
      return result.data;
    },

    onSuccess: (data, { briefId }) => {
      // Invalidate the brief to refetch with new review
      queryClient.invalidateQueries({ queryKey: ['brief', briefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}

/**
 * Hook for deleting a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, briefId }: { reviewId: string; briefId: string }) => {
      const result = await deleteBriefReview(reviewId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete review');
      }
      return result;
    },

    onSuccess: (data, { briefId }) => {
      // Invalidate the brief to refetch without the deleted review
      queryClient.invalidateQueries({ queryKey: ['brief', briefId] });
      queryClient.invalidateQueries({ queryKey: ['briefs'] });
    },
  });
}
