// @ts-nocheck - Prisma models not yet in schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * Bot detection rules and thresholds
 */
const BOT_DETECTION_RULES = {
  // Request patterns
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_REQUESTS_PER_HOUR: 500,

  // Behavior patterns
  MIN_MOUSE_EVENTS: 5,
  MIN_KEYBOARD_EVENTS: 3,
  MIN_SESSION_DURATION: 5, // seconds

  // Known bot patterns
  BOT_USER_AGENTS: [
    'bot', 'crawler', 'spider', 'scraper',
    'curl', 'wget', 'python-requests',
    'go-http-client', 'java/', 'scrapy',
  ],

  // Suspicious patterns
  HONEYPOT_FIELD: 'website_url', // Hidden field that bots fill
  MAX_FORM_SUBMIT_SPEED: 2, // seconds
};

/**
 * Bot score thresholds
 */
const BOT_THRESHOLDS = {
  LOW: 30,      // Suspicious - add captcha
  MEDIUM: 60,   // Likely bot - block action
  HIGH: 80,     // Definite bot - block + log
  CRITICAL: 95, // Automated attack - rate limit
};

interface BotCheckResult {
  isBot: boolean;
  confidence: number;
  reasons: string[];
  action: 'allow' | 'captcha' | 'block' | 'rate_limit';
}

interface BotCheckParams {
  userAgent?: string;
  ip?: string;
  honeypotValue?: string;
  formSubmitTime?: number; // milliseconds since form loaded
  mouseEvents?: number;
  keyboardEvents?: number;
  sessionDuration?: number; // seconds
}

/**
 * Check if request is from a bot
 */
export async function checkBot(params?: BotCheckParams): Promise<BotCheckResult> {
  try {
    const session = await auth();
    const headersList = await headers();

    const userAgent = params?.userAgent || headersList.get('user-agent') || '';
    const ip = params?.ip || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';

    const reasons: string[] = [];
    let botScore = 0;

    // 1. Check User-Agent for known bots
    const lowercaseUA = userAgent.toLowerCase();
    const matchedBotUA = BOT_DETECTION_RULES.BOT_USER_AGENTS.find(bot =>
      lowercaseUA.includes(bot)
    );

    if (matchedBotUA) {
      reasons.push(`Bot user agent: ${matchedBotUA}`);
      botScore += 50;
    }

    // 2. Check for missing or suspicious User-Agent
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or invalid user agent');
      botScore += 30;
    }

    // 3. Check honeypot field
    if (params?.honeypotValue) {
      reasons.push('Honeypot field filled');
      botScore += 80; // Very strong indicator
    }

    // 4. Check form submit speed
    if (params?.formSubmitTime !== undefined) {
      const submitSeconds = params.formSubmitTime / 1000;
      if (submitSeconds < BOT_DETECTION_RULES.MAX_FORM_SUBMIT_SPEED) {
        reasons.push(`Form submitted too fast (${submitSeconds.toFixed(1)}s)`);
        botScore += 40;
      }
    }

    // 5. Check mouse/keyboard interaction
    if (params?.mouseEvents !== undefined && params.mouseEvents < BOT_DETECTION_RULES.MIN_MOUSE_EVENTS) {
      reasons.push(`Insufficient mouse events (${params.mouseEvents})`);
      botScore += 25;
    }

    if (params?.keyboardEvents !== undefined && params.keyboardEvents < BOT_DETECTION_RULES.MIN_KEYBOARD_EVENTS) {
      reasons.push(`Insufficient keyboard events (${params.keyboardEvents})`);
      botScore += 20;
    }

    // 6. Check session duration
    if (params?.sessionDuration !== undefined && params.sessionDuration < BOT_DETECTION_RULES.MIN_SESSION_DURATION) {
      reasons.push(`Session too short (${params.sessionDuration}s)`);
      botScore += 30;
    }

    // 7. Check request rate from IP
    if (ip && session?.user?.id) {
      const rateCheck = await checkRequestRate(ip, session.user.id);
      if (!rateCheck.allowed) {
        reasons.push(`Rate limit exceeded (${rateCheck.requestsPerMinute}/min)`);
        botScore += 35;
      }
    }

    // 8. Check for suspicious patterns (same IP, different users)
    if (ip && session?.user?.id) {
      const ipPatterns = await checkIPPatterns(ip);
      if (ipPatterns.suspicious) {
        reasons.push(`Suspicious IP activity (${ipPatterns.userCount} users)`);
        botScore += 25;
      }
    }

    // Determine action based on score
    let action: 'allow' | 'captcha' | 'block' | 'rate_limit';
    if (botScore >= BOT_THRESHOLDS.CRITICAL) {
      action = 'rate_limit';
    } else if (botScore >= BOT_THRESHOLDS.HIGH) {
      action = 'block';
    } else if (botScore >= BOT_THRESHOLDS.MEDIUM) {
      action = 'block';
    } else if (botScore >= BOT_THRESHOLDS.LOW) {
      action = 'captcha';
    } else {
      action = 'allow';
    }

    const isBot = botScore >= BOT_THRESHOLDS.LOW;

    // Log bot detection
    if (isBot && session?.user?.id) {
      await logBotDetection(session.user.id, ip, userAgent, botScore, reasons, action);
    }

    return {
      isBot,
      confidence: Math.min(botScore, 100),
      reasons,
      action,
    };
  } catch (error) {
    console.error('[Bot Detection] Error:', error);
    return {
      isBot: false,
      confidence: 0,
      reasons: ['Error during bot detection'],
      action: 'allow',
    };
  }
}

/**
 * Check request rate from IP
 */
async function checkRequestRate(
  ip: string,
  userId: string
): Promise<{ allowed: boolean; requestsPerMinute: number; requestsPerHour: number }> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [requestsPerMinute, requestsPerHour] = await Promise.all([
    prisma.requestLog.count({
      where: {
        OR: [{ ipAddress: ip }, { userId }],
        createdAt: { gte: oneMinuteAgo },
      },
    }),
    prisma.requestLog.count({
      where: {
        OR: [{ ipAddress: ip }, { userId }],
        createdAt: { gte: oneHourAgo },
      },
    }),
  ]);

  const allowed =
    requestsPerMinute < BOT_DETECTION_RULES.MAX_REQUESTS_PER_MINUTE &&
    requestsPerHour < BOT_DETECTION_RULES.MAX_REQUESTS_PER_HOUR;

  return {
    allowed,
    requestsPerMinute,
    requestsPerHour,
  };
}

/**
 * Check for suspicious IP patterns
 */
async function checkIPPatterns(ip: string): Promise<{ suspicious: boolean; userCount: number }> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count unique users from this IP in last 24 hours
  const users = await prisma.requestLog.findMany({
    where: {
      ipAddress: ip,
      createdAt: { gte: oneDayAgo },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const userCount = users.length;

  // Suspicious if many different users from same IP
  return {
    suspicious: userCount > 10,
    userCount,
  };
}

/**
 * Log bot detection
 */
async function logBotDetection(
  userId: string,
  ip: string,
  userAgent: string,
  score: number,
  reasons: string[],
  action: string
): Promise<void> {
  try {
    await prisma.botDetectionLog.create({
      data: {
        userId,
        ipAddress: ip,
        userAgent,
        botScore: score,
        reasons: reasons.join('; '),
        action,
      },
    });

    // Auto rate-limit if score is critical
    if (score >= BOT_THRESHOLDS.CRITICAL) {
      await addToRateLimit(ip, userId);
    }
  } catch (error) {
    console.error('[Bot Detection] Failed to log:', error);
  }
}

/**
 * Add IP/user to rate limit list
 */
async function addToRateLimit(ip: string, userId: string): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.rateLimitEntry.upsert({
      where: {
        identifier: `${ip}:${userId}`,
      },
      update: {
        requestCount: { increment: 1 },
        expiresAt,
      },
      create: {
        identifier: `${ip}:${userId}`,
        ipAddress: ip,
        userId,
        requestCount: 1,
        expiresAt,
      },
    });

    console.warn(`[Bot Detection] Rate limited: ${ip} (${userId})`);
  } catch (error) {
    console.error('[Bot Detection] Failed to add rate limit:', error);
  }
}

/**
 * Check if IP/user is rate limited
 */
export async function checkRateLimit(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return false;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';

    const identifier = `${ip}:${session.user.id}`;

    const entry = await prisma.rateLimitEntry.findUnique({
      where: { identifier },
    });

    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt < new Date()) {
      await prisma.rateLimitEntry.delete({ where: { identifier } });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Bot Detection] Failed to check rate limit:', error);
    return false;
  }
}

/**
 * Log request for rate limiting
 */
export async function logRequest(): Promise<void> {
  try {
    const session = await auth();
    const headersList = await headers();

    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    const userAgent = headersList.get('user-agent') || '';

    await prisma.requestLog.create({
      data: {
        userId: session?.user?.id,
        ipAddress: ip,
        userAgent,
        path: headersList.get('referer') || '',
      },
    });
  } catch (error) {
    console.error('[Bot Detection] Failed to log request:', error);
  }
}

/**
 * Get bot detection logs
 */
export async function getBotDetectionLogs(options?: {
  limit?: number;
  offset?: number;
  action?: 'captcha' | 'block' | 'rate_limit';
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (!session?.user?.isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const { limit = 50, offset = 0, action } = options || {};

    const [logs, total] = await Promise.all([
      prisma.botDetectionLog.findMany({
        where: action ? { action } : undefined,
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
      prisma.botDetectionLog.count({
        where: action ? { action } : undefined,
      }),
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
    console.error('[Bot Detection] Failed to get logs:', error);
    return {
      success: false,
      error: 'Failed to get bot detection logs',
    };
  }
}

/**
 * Get user bot score
 */
export async function getUserBotScore(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const logs = await prisma.botDetectionLog.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalScore = logs.reduce((sum, log) => sum + log.botScore, 0);
    const avgScore = logs.length > 0 ? totalScore / logs.length : 0;

    return {
      success: true,
      data: {
        averageScore: avgScore,
        recentLogs: logs,
        isBlocked: avgScore > BOT_THRESHOLDS.MEDIUM,
      },
    };
  } catch (error) {
    console.error('[Bot Detection] Failed to get user bot score:', error);
    return {
      success: false,
      error: 'Failed to get bot score',
    };
  }
}
