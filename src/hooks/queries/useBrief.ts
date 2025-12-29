import { useQuery } from '@tanstack/react-query';
import { getBriefById } from '@/server/actions/briefs/core-operations';

export function useBrief(briefId: string | null) {
  return useQuery({
    queryKey: ['brief', briefId],
    queryFn: async () => {
      if (!briefId) throw new Error('Brief ID required');
      const result = await getBriefById(briefId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brief');
      }
      return result.data;
    },
    enabled: !!briefId, // Only run if briefId exists
    staleTime: 60 * 1000, // Individual briefs stay fresh for 1 minute
  });
}
