import { useQuery } from '@tanstack/react-query';
import { getBriefStats } from '@/server/actions/home';

export function useStats() {
  return useQuery({
    queryKey: ['briefStats'],
    queryFn: async () => {
      const result = await getBriefStats();
      if (!result.success) throw new Error(result.error || 'Failed to fetch stats');
      return result.data;
    },
    // Stats: 60 seconds
    staleTime: 60 * 1000,
  });
}
