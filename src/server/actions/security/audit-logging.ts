// @ts-nocheck - Prisma models not yet in schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * Security event types
 */
export const SECURITY_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',

  // Account changes
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  PROFILE_UPDATE: 'profile_update',
  ACCOUNT_DELETION: 'account_deletion',

  // Permissions
  ROLE_CHANGE: 'role_change',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_REVOKED: 'permission_revoked',

  // Security
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_TRIGGERED: 'rate_limit_triggered',
  BOT_DETECTED: 'bot_detected',
  SPAM_DETECTED: 'spam_detected',

  // Admin actions
  ADMIN_ACTION: 'admin_action',
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned',
  CONTENT_MODERATED: 'content_moderated',

  // Data access
  DATA_EXPORT: 'data_export',
  DATA_DELETION: 'data_deletion',
} as const;

type SecurityEvent = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];
type SecurityAction = 'success' | 'failure' | 'attempt';
type SecuritySeverity = 'info' | 'warning' | 'critical';

interface LogSecurityEventParams {
  userId?: string;
  event: SecurityEvent;
  action: SecurityAction;
  details?: Record<string, any>;
  severity?: SecuritySeverity;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(params: LogSecurityEventParams) {
  try {
    const headersList = await headers();

    const ipAddress = params.ipAddress ||
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      '';

    const userAgent = params.userAgent ||
      headersList.get('user-agent') ||
      '';

    await prisma.securityAuditLog.create({
      data: {
        userId: params.userId,
        ipAddress,
        userAgent,
        event: params.event,
        action: params.action,
        details: params.details ? JSON.stringify(params.details) : null,
        severity: params.severity || 'info',
      },
    });

    // Log critical events to console
    if (params.severity === 'critical') {
      console.warn('[Security Audit]', {
        event: params.event,
        userId: params.userId,
        ipAddress,
        details: params.details,
      });
    }
  } catch (error) {
    console.error('[Security Audit] Failed to log event:', error);
  }
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  email: string,
  success: boolean,
  userId?: string
) {
  await logSecurityEvent({
    userId,
    event: success ? SECURITY_EVENTS.LOGIN_SUCCESS : SECURITY_EVENTS.LOGIN_FAILURE,
    action: success ? 'success' : 'failure',
    details: { email },
    severity: success ? 'info' : 'warning',
  });
}

/**
 * Log logout
 */
export async function logLogout(userId: string) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.LOGOUT,
    action: 'success',
    severity: 'info',
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(userId: string, success: boolean) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.PASSWORD_CHANGE,
    action: success ? 'success' : 'failure',
    severity: success ? 'info' : 'warning',
  });
}

/**
 * Log email change
 */
export async function logEmailChange(
  userId: string,
  oldEmail: string,
  newEmail: string,
  success: boolean
) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.EMAIL_CHANGE,
    action: success ? 'success' : 'failure',
    details: { oldEmail, newEmail },
    severity: success ? 'info' : 'warning',
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  reason: string,
  details?: Record<string, any>
) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
    action: 'attempt',
    details: { reason, ...details },
    severity: 'critical',
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  actionType: string,
  targetUserId?: string,
  details?: Record<string, any>
) {
  await logSecurityEvent({
    userId: adminUserId,
    event: SECURITY_EVENTS.ADMIN_ACTION,
    action: 'success',
    details: {
      actionType,
      targetUserId,
      ...details,
    },
    severity: 'warning',
  });
}

/**
 * Log data export
 */
export async function logDataExport(userId: string) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.DATA_EXPORT,
    action: 'success',
    severity: 'info',
  });
}

/**
 * Log account deletion
 */
export async function logAccountDeletion(
  userId: string,
  reason?: string
) {
  await logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.ACCOUNT_DELETION,
    action: 'success',
    details: { reason },
    severity: 'warning',
  });
}

/**
 * Get security audit logs
 */
export async function getSecurityAuditLogs(options?: {
  userId?: string;
  event?: SecurityEvent;
  severity?: SecuritySeverity;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const isViewingOwnLogs = options?.userId === session.user.id;
    if (!session?.user?.isAdmin && !isViewingOwnLogs) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const {
      userId,
      event,
      severity,
      limit = 50,
      offset = 0,
    } = options || {};

    const where: any = {};

    if (userId) where.userId = userId;
    if (event) where.event = event;
    if (severity) where.severity = severity;

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        hasMore: offset + logs.length < total,
      },
    };
  } catch (error) {
    console.error('[Security Audit] Failed to get logs:', error);
    return {
      success: false,
      error: 'Failed to get security audit logs',
    };
  }
}

/**
 * Get security summary for user
 */
export async function getUserSecuritySummary(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      recentEvents,
      failedLogins,
      criticalEvents,
      lastLogin,
    ] = await Promise.all([
      prisma.securityAuditLog.count({
        where: { userId: targetUserId },
      }),

      prisma.securityAuditLog.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.securityAuditLog.count({
        where: {
          userId: targetUserId,
          event: SECURITY_EVENTS.LOGIN_FAILURE,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.securityAuditLog.count({
        where: {
          userId: targetUserId,
          severity: 'critical',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.securityAuditLog.findFirst({
        where: {
          userId: targetUserId,
          event: SECURITY_EVENTS.LOGIN_SUCCESS,
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, ipAddress: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalEvents,
        recentEvents,
        failedLogins,
        criticalEvents,
        lastLogin: lastLogin?.createdAt,
        lastLoginIP: lastLogin?.ipAddress,
        hasRecentSuspiciousActivity: criticalEvents > 0,
      },
    };
  } catch (error) {
    console.error('[Security Audit] Failed to get summary:', error);
    return {
      success: false,
      error: 'Failed to get security summary',
    };
  }
}

/**
 * Get failed login attempts for IP
 */
export async function getFailedLoginsByIP(ipAddress: string, hours: number = 1) {
  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const count = await prisma.securityAuditLog.count({
      where: {
        ipAddress,
        event: SECURITY_EVENTS.LOGIN_FAILURE,
        createdAt: { gte: cutoffTime },
      },
    });

    return {
      success: true,
      data: { count, threshold: 5 }, // 5 failed attempts triggers lockout
    };
  } catch (error) {
    console.error('[Security Audit] Failed to get failed logins:', error);
    return {
      success: false,
      error: 'Failed to get failed login count',
    };
  }
}
