'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { checkSpam, getUserSpamScore, getSpamReports } from '@/server/actions/moderation/spam-detection';
import { toast } from 'sonner';

/**
 * Check if content is spam
 */
export function useSpamCheck() {
  return useMutation({
    mutationFn: async (params: {
      content: string;
      type: 'brief' | 'review' | 'comment';
    }) => {
      const result = await checkSpam(params.content, params.type);
      return result;
    },
    onSuccess: (data) => {
      if (data.isSpam) {
        if (data.action === 'ban') {
          toast.error('Spam detected', {
            description: 'Your account has been flagged for suspicious activity.',
          });
        } else if (data.action === 'hide') {
          toast.warning('Content flagged', {
            description: 'Your content has been flagged for review and will be hidden until approved.',
          });
        } else if (data.action === 'flag') {
          toast.info('Content under review', {
            description: 'Your content will be reviewed by moderators.',
          });
        }
      }
    },
  });
}

/**
 * Get user's spam score
 */
export function useUserSpamScore(userId?: string) {
  return useQuery({
    queryKey: ['spam-score', userId],
    queryFn: async () => {
      const result = await getUserSpamScore(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Admin: Get spam reports
 */
export function useSpamReports(options?: {
  limit?: number;
  offset?: number;
  action?: 'flag' | 'hide' | 'ban';
}) {
  return useQuery({
    queryKey: ['spam-reports', options?.action, options?.limit, options?.offset],
    queryFn: async () => {
      const result = await getSpamReports(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Helper: Check spam before submitting content
 * Returns true if content should be allowed, false if blocked
 */
export async function checkContentBeforeSubmit(
  content: string,
  type: 'brief' | 'review' | 'comment'
): Promise<boolean> {
  const result = await checkSpam(content, type);

  if (result.action === 'ban' || result.action === 'hide') {
    toast.error('Content blocked', {
      description: result.reasons.join(', '),
    });
    return false;
  }

  if (result.action === 'flag') {
    toast.warning('Content flagged for review', {
      description: 'Your content will be reviewed by moderators.',
    });
  }

  return true;
}
