import { useQuery } from '@tanstack/react-query';
import { getBriefs } from '@/server/actions/explore';

interface UseBriefsParams {
  page?: number;
  sortBy?: "popular" | "new" | "controversial";
  categories?: string[];
  search?: string;
  modelFilter?: string;
  limit?: number;
}

export function useBriefs(params: UseBriefsParams = {}) {
  return useQuery({
    // Unique key for this query - changes when params change
    queryKey: ['briefs', params],

    // Fetch function
    queryFn: async () => {
      const result = await getBriefs(params);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch briefs');
      }
      // Return the full result object (includes data, total, totalPages, etc.)
      return result;
    },

    // Briefs: 30 second stale time
    staleTime: 30 * 1000,

    // Keep previous data while fetching new (prevents layout shift)
    placeholderData: (previousData) => previousData,
  });
}
