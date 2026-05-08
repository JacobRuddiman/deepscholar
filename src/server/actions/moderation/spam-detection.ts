// @ts-nocheck - Prisma models not yet in schema, pending migration
'use server';

import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';

/**
 * Spam detection rules and thresholds
 */
const SPAM_RULES = {
  // Rate limiting
  MAX_BRIEFS_PER_HOUR: 5,
  MAX_REVIEWS_PER_HOUR: 10,
  MAX_COMMENTS_PER_HOUR: 20,

  // Content patterns
  MIN_CONTENT_LENGTH: 50,
  MAX_LINKS_PER_POST: 3,
  MAX_REPEATED_CHARS: 5,
  MAX_CAPS_PERCENTAGE: 0.7,

  // Behavior patterns
  MAX_DUPLICATE_CONTENT_RATIO: 0.8,
  MIN_TIME_BETWEEN_POSTS: 10, // seconds

  // Spam keywords (basic list)
  SPAM_KEYWORDS: [
    'buy now',
    'click here',
    'limited time',
    'act now',
    'free money',
    'make money fast',
    'work from home',
    'bitcoin',
    'cryptocurrency',
    'investment opportunity',
  ],
};

/**
 * Spam score thresholds
 */
const SPAM_THRESHOLDS = {
  LOW: 30,      // Flag for review
  MEDIUM: 60,   // Auto-hide pending review
  HIGH: 80,     // Auto-ban
  CRITICAL: 95, // Instant ban + report
};

interface SpamCheckResult {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  action: 'allow' | 'flag' | 'hide' | 'ban';
}

/**
 * Check if content is spam
 */
export async function checkSpam(content: string, type: 'brief' | 'review' | 'comment'): Promise<SpamCheckResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        isSpam: false,
        confidence: 0,
        reasons: ['User not authenticated'],
        action: 'allow',
      };
    }

    const reasons: string[] = [];
    let spamScore = 0;

    // 1. Check content length
    if (content.length < SPAM_RULES.MIN_CONTENT_LENGTH) {
      reasons.push('Content too short');
      spamScore += 15;
    }

    // 2. Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > SPAM_RULES.MAX_LINKS_PER_POST) {
      reasons.push(`Too many links (${linkCount})`);
      spamScore += 25;
    }

    // 3. Check for repeated characters
    const repeatedChars = /(.)\1{5,}/g;
    if (repeatedChars.test(content)) {
      reasons.push('Excessive repeated characters');
      spamScore += 20;
    }

    // 4. Check for excessive caps
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
    const capsPercentage = totalLetters > 0 ? capsCount / totalLetters : 0;

    if (capsPercentage > SPAM_RULES.MAX_CAPS_PERCENTAGE) {
      reasons.push(`Excessive capitals (${Math.round(capsPercentage * 100)}%)`);
      spamScore += 15;
    }

    // 5. Check for spam keywords
    const lowercaseContent = content.toLowerCase();
    const matchedKeywords = SPAM_RULES.SPAM_KEYWORDS.filter(keyword =>
      lowercaseContent.includes(keyword)
    );

    if (matchedKeywords.length > 0) {
      reasons.push(`Spam keywords: ${matchedKeywords.join(', ')}`);
      spamScore += matchedKeywords.length * 10;
    }

    // 6. Check rate limiting
    const rateLimit = await checkRateLimit(session.user.id, type);
    if (!rateLimit.allowed) {
      reasons.push(`Rate limit exceeded (${rateLimit.count} in last hour)`);
      spamScore += 30;
    }

    // 7. Check for duplicate content
    const duplicateCheck = await checkDuplicateContent(session.user.id, content, type);
    if (duplicateCheck.isDuplicate) {
      reasons.push(`Duplicate content (${Math.round(duplicateCheck.similarity * 100)}% similar)`);
      spamScore += 35;
    }

    // 8. Check posting frequency
    const lastPost = await getLastPostTime(session.user.id, type);
    if (lastPost) {
      const timeSinceLastPost = (Date.now() - lastPost.getTime()) / 1000;
      if (timeSinceLastPost < SPAM_RULES.MIN_TIME_BETWEEN_POSTS) {
        reasons.push(`Posting too fast (${Math.round(timeSinceLastPost)}s since last post)`);
        spamScore += 25;
      }
    }

    // Determine action based on score
    let action: 'allow' | 'flag' | 'hide' | 'ban';
    if (spamScore >= SPAM_THRESHOLDS.CRITICAL) {
      action = 'ban';
    } else if (spamScore >= SPAM_THRESHOLDS.HIGH) {
      action = 'ban';
    } else if (spamScore >= SPAM_THRESHOLDS.MEDIUM) {
      action = 'hide';
    } else if (spamScore >= SPAM_THRESHOLDS.LOW) {
      action = 'flag';
    } else {
      action = 'allow';
    }

    const isSpam = spamScore >= SPAM_THRESHOLDS.LOW;

    // Log spam detection
    if (isSpam) {
      await logSpamDetection(session.user.id, type, content, spamScore, reasons, action);
    }

    return {
      isSpam,
      confidence: Math.min(spamScore, 100),
      reasons,
      action,
    };
  } catch (error) {
    console.error('[Spam Detection] Error:', error);
    return {
      isSpam: false,
      confidence: 0,
      reasons: ['Error during spam detection'],
      action: 'allow',
    };
  }
}

/**
 * Check rate limiting
 */
async function checkRateLimit(
  userId: string,
  type: 'brief' | 'review' | 'comment'
): Promise<{ allowed: boolean; count: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  let count = 0;
  let maxAllowed = 0;

  switch (type) {
    case 'brief':
      maxAllowed = SPAM_RULES.MAX_BRIEFS_PER_HOUR;
      count = await prisma.brief.count({
        where: {
          userId: userId,
          createdAt: { gte: oneHourAgo },
        },
      });
      break;

    case 'review':
      maxAllowed = SPAM_RULES.MAX_REVIEWS_PER_HOUR;
      count = await prisma.review.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
        },
      });
      break;

    case 'comment':
      maxAllowed = SPAM_RULES.MAX_COMMENTS_PER_HOUR;
      // Assuming you have a Comment model
      count = 0; // TODO: Implement when Comment model exists
      break;
  }

  return {
    allowed: count < maxAllowed,
    count,
  };
}

/**
 * Check for duplicate content
 */
async function checkDuplicateContent(
  userId: string,
  content: string,
  type: 'brief' | 'review' | 'comment'
): Promise<{ isDuplicate: boolean; similarity: number }> {
  const recentContent = await getRecentContent(userId, type);

  let maxSimilarity = 0;

  for (const item of recentContent) {
    const similarity = calculateSimilarity(content, item);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
  }

  return {
    isDuplicate: maxSimilarity > SPAM_RULES.MAX_DUPLICATE_CONTENT_RATIO,
    similarity: maxSimilarity,
  };
}

/**
 * Get recent content by user
 */
async function getRecentContent(
  userId: string,
  type: 'brief' | 'review' | 'comment'
): Promise<string[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  switch (type) {
    case 'brief':
      const briefs = await prisma.brief.findMany({
        where: {
          userId: userId,
          createdAt: { gte: oneDayAgo },
        },
        select: { response: true },
        take: 10,
      });
      return briefs.map(b => b.response);

    case 'review':
      const reviews = await prisma.review.findMany({
        where: {
          userId,
          createdAt: { gte: oneDayAgo },
        },
        select: { content: true },
        take: 10,
      });
      return reviews.map(r => r.content || '');

    case 'comment':
      // TODO: Implement when Comment model exists
      return [];
  }
}

/**
 * Calculate content similarity (simple Jaccard similarity)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Get last post time
 */
async function getLastPostTime(
  userId: string,
  type: 'brief' | 'review' | 'comment'
): Promise<Date | null> {
  switch (type) {
    case 'brief':
      const lastBrief = await prisma.brief.findFirst({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      return lastBrief?.createdAt || null;

    case 'review':
      const lastReview = await prisma.review.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      return lastReview?.createdAt || null;

    case 'comment':
      // TODO: Implement when Comment model exists
      return null;
  }
}

/**
 * Log spam detection
 */
async function logSpamDetection(
  userId: string,
  type: string,
  content: string,
  score: number,
  reasons: string[],
  action: string
): Promise<void> {
  try {
    await prisma.spamDetectionLog.create({
      data: {
        userId,
        contentType: type,
        content: content.substring(0, 500), // Store first 500 chars
        spamScore: score,
        reasons: reasons.join('; '),
        action,
      },
    });

    // Auto-ban if score is critical
    if (score >= SPAM_THRESHOLDS.CRITICAL) {
      await flagUserAsSpammer(userId, reasons.join('; '));
    }
  } catch (error) {
    console.error('[Spam Detection] Failed to log:', error);
  }
}

/**
 * Flag user as spammer
 */
async function flagUserAsSpammer(userId: string, reason: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Assuming you have a spamStatus field
        // spamStatus: 'flagged',
        // Or create a separate SpamFlag table
      },
    });

    // TODO: Send notification to admins
    console.warn(`[Spam Detection] User ${userId} flagged as spammer: ${reason}`);
  } catch (error) {
    console.error('[Spam Detection] Failed to flag user:', error);
  }
}

/**
 * Get user spam score
 */
export async function getUserSpamScore(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const logs = await prisma.spamDetectionLog.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalScore = logs.reduce((sum, log) => sum + log.spamScore, 0);
    const avgScore = logs.length > 0 ? totalScore / logs.length : 0;

    return {
      success: true,
      data: {
        averageScore: avgScore,
        recentLogs: logs,
        isFlagged: avgScore > SPAM_THRESHOLDS.MEDIUM,
      },
    };
  } catch (error) {
    console.error('[Spam Detection] Failed to get user spam score:', error);
    return {
      success: false,
      error: 'Failed to get spam score',
    };
  }
}

/**
 * Admin: Get spam reports
 */
export async function getSpamReports(options?: {
  limit?: number;
  offset?: number;
  action?: 'flag' | 'hide' | 'ban';
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

    const [reports, total] = await Promise.all([
      prisma.spamDetectionLog.findMany({
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
      prisma.spamDetectionLog.count({
        where: action ? { action } : undefined,
      }),
    ]);

    return {
      success: true,
      data: {
        reports,
        total,
        hasMore: offset + reports.length < total,
      },
    };
  } catch (error) {
    console.error('[Spam Detection] Failed to get spam reports:', error);
    return {
      success: false,
      error: 'Failed to get spam reports',
    };
  }
}
