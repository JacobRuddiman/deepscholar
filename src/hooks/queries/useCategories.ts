import { useQuery } from '@tanstack/react-query';
import { getAllCategories } from '@/server/actions/explore';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getAllCategories();
      if (!result.success) throw new Error(result.error || 'Failed to fetch categories');
      return result.data;
    },
    // Categories rarely change, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
