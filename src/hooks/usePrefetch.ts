import { useQueryClient } from '@tanstack/react-query';
import { getBriefById } from '@/server/actions/briefs/core-operations';
import { getUserProfile } from '@/server/actions/users';

/**
 * Hook for prefetching data on hover
 * Improves perceived performance by loading data before user clicks
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchBrief = (briefId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['brief', briefId],
      queryFn: async () => {
        const result = await getBriefById(briefId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch brief');
        }
        return result.data;
      },
      staleTime: 60 * 1000, // 1 minute
    });
  };

  const prefetchUserProfile = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['userProfile', userId],
      queryFn: async () => {
        const result = await getUserProfile(userId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user profile');
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    prefetchBrief,
    prefetchUserProfile,
  };
}
