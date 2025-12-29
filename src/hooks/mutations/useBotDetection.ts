'use client';

import { useMutation, useQuery } from '@tantml:query-client';
import {
  checkBot,
  checkRateLimit,
  getBotDetectionLogs,
  getUserBotScore,
} from '@/server/actions/security/bot-detection';
import { toast } from 'sonner';

interface BotCheckParams {
  userAgent?: string;
  ip?: string;
  honeypotValue?: string;
  formSubmitTime?: number;
  mouseEvents?: number;
  keyboardEvents?: number;
  sessionDuration?: number;
}

/**
 * Check if request is from a bot
 */
export function useBotCheck() {
  return useMutation({
    mutationFn: async (params?: BotCheckParams) => {
      const result = await checkBot(params);
      return result;
    },
    onSuccess: (data) => {
      if (data.isBot) {
        if (data.action === 'rate_limit' || data.action === 'block') {
          toast.error('Access blocked', {
            description: 'Suspicious activity detected. Please contact support if this is a mistake.',
          });
        } else if (data.action === 'captcha') {
          toast.warning('Verification required', {
            description: 'Please complete the captcha to continue.',
          });
        }
      }
    },
  });
}

/**
 * Check if user/IP is rate limited
 */
export function useRateLimitCheck() {
  return useQuery({
    queryKey: ['rate-limit-status'],
    queryFn: async () => {
      const isLimited = await checkRateLimit();
      return isLimited;
    },
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Get user's bot score
 */
export function useUserBotScore(userId?: string) {
  return useQuery({
    queryKey: ['bot-score', userId],
    queryFn: async () => {
      const result = await getUserBotScore(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Admin: Get bot detection logs
 */
export function useBotDetectionLogs(options?: {
  limit?: number;
  offset?: number;
  action?: 'captcha' | 'block' | 'rate_limit';
}) {
  return useQuery({
    queryKey: ['bot-detection-logs', options?.action, options?.limit, options?.offset],
    queryFn: async () => {
      const result = await getBotDetectionLogs(options);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
