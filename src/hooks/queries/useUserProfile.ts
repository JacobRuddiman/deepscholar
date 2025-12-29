import { useQuery } from '@tanstack/react-query';
import { getUserBriefs } from '@/server/actions/briefs/core-operations';
import { getSavedBriefs, getUserReviews, getUserUpvotes } from '@/server/actions/briefs';
import { getUserTokenBalance } from '@/server/actions/tokens';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const [briefs, saved, reviews, upvotes, tokenBalance] = await Promise.all([
        getUserBriefs(),
        getSavedBriefs(),
        getUserReviews(),
        getUserUpvotes(),
        getUserTokenBalance(),
      ]);

      return {
        briefs: briefs.success ? briefs.data : [],
        savedBriefs: saved.success ? saved.data : [],
        reviews: reviews.success ? reviews.data : [],
        upvotes: upvotes.success ? upvotes.data : [],
        tokenBalance: tokenBalance.success ? tokenBalance.balance : 0,
      };
    },
    staleTime: 30 * 1000, // User profile: 30 seconds
  });
}
