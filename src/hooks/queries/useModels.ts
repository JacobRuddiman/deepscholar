import { useQuery } from '@tanstack/react-query';
import { getAllModels } from '@/server/actions/explore';

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const result = await getAllModels();
      if (!result.success) throw new Error(result.error || 'Failed to fetch models');
      return result.data;
    },
    // Models rarely change, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
