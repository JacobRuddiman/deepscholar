'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSecurityAuditLogs,
  getUserSecuritySummary,
  SECURITY_EVENTS,
} from '@/server/actions/security/audit-logging';

/**
 * Get security audit logs
 */
export function useSecurityAuditLogs(options?: {
  userId?: string;
  event?: string;
  severity?: 'info' | 'warning' | 'critical';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['security-audit-logs', options],
    queryFn: async () => {
      const result = await getSecurityAuditLogs(options as Parameters<typeof getSecurityAuditLogs>[0]);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get user security summary
 */
export function useUserSecuritySummary(userId?: string) {
  return useQuery({
    queryKey: ['security-summary', userId],
    queryFn: async () => {
      const result = await getUserSecuritySummary(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Export security events for use in components
export { SECURITY_EVENTS };
