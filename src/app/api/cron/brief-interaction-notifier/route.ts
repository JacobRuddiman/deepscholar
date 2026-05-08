import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { apiSuccess, apiError } from '@/lib/api-response';

// Helper function to format email-like console log
function logEmail(to: string, subject: string, body: string) {
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL NOTIFICATION');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-'.repeat(80));
  console.log(body);
  console.log('-'.repeat(80));
  console.log('Footer: © 2025 DeepScholar - Your AI Research Companion');
  console.log('Visit us at: https://deepscholar.com');
  console.log('='.repeat(80) + '\n');
}

// Helper function to get yesterday's date range
function getYesterdayRange() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const startOfYesterday = new Date(yesterday);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  return { startOfYesterday, endOfYesterday };
}

async function checkBriefInteractions(userId?: string) {
  const { startOfYesterday, endOfYesterday } = getYesterdayRange();

  console.log(`🔍 Checking brief interactions for ${userId ? `user ${userId}` : 'all users'} from ${startOfYesterday.toISOString()} to ${endOfYesterday.toISOString()}`);

  // Get users to check
  const users = userId
    ? await db.user.findMany({ where: { id: userId } })
    : await db.user.findMany({ where: { email: { not: null } } });

  console.log(`📊 Found ${users.length} users to check`);

  for (const user of users) {
    // Get user's briefs with interactions from yesterday
    const briefsWithInteractions = await db.brief.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            upvotes: {
              some: {
                createdAt: {
                  gte: startOfYesterday,
                  lte: endOfYesterday
                }
              }
            }
          },
          {
            reviews: {
              some: {
                createdAt: {
                  gte: startOfYesterday,
                  lte: endOfYesterday
                }
              }
            }
          }
        ]
      },
      include: {
        upvotes: {
          where: {
            createdAt: {
              gte: startOfYesterday,
              lte: endOfYesterday
            }
          }
        },
        reviews: {
          where: {
            createdAt: {
              gte: startOfYesterday,
              lte: endOfYesterday
            }
          },
          include: {
            author: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Filter briefs that have 5+ interactions
    const qualifyingBriefs = briefsWithInteractions.filter(brief =>
      (brief.upvotes.length + brief.reviews.length) >= 5
    );

    console.log(`👤 User ${user.name ?? user.email ?? user.id}: ${qualifyingBriefs.length} qualifying briefs`);

    if (qualifyingBriefs.length > 0) {
      // Generate congratulatory email
      const subject = `🎉 Congratulations! Your research briefs are gaining traction`;

      let body = `Dear ${user.name ?? 'Researcher'},\n\n`;
      body += `Great news! Your research briefs received significant engagement yesterday:\n\n`;

      for (const brief of qualifyingBriefs) {
        const totalInteractions = brief.upvotes.length + brief.reviews.length;
        body += `📄 "${brief.title}"\n`;
        body += `   • ${brief.upvotes.length} new upvotes\n`;
        body += `   • ${brief.reviews.length} new reviews\n`;
        body += `   • Total: ${totalInteractions} interactions\n`;

        if (brief.reviews.length > 0) {
          body += `   Recent reviewers: ${brief.reviews.map(r => r.author.name ?? 'Anonymous').join(', ')}\n`;
        }
        body += `\n`;
      }

      body += `Keep up the excellent work! Your contributions are making a real impact in the research community.\n\n`;
      body += `Best regards,\nThe DeepScholar Team`;

      logEmail(user.email ?? `${user.name} (${user.id})`, subject, body);
    }
  }
}

// GET handler for CRON
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }

    console.log('🕐 CRON: Brief Interaction Notifier started');
    await checkBriefInteractions();
    console.log('✅ CRON: Brief Interaction Notifier completed');

    return apiSuccess({ message: 'Brief interaction notifications processed' });
  } catch (error) {
    console.error('❌ CRON: Brief Interaction Notifier failed:', error);
    return apiError('Failed to process brief interaction notifications', 500);
  }
}

// POST handler for manual triggering
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json().catch(() => ({})) as { userId?: string };
    const { userId } = body;

    console.log('🔧 MANUAL: Brief Interaction Notifier started', userId ? `for user ${userId}` : 'for all users');
    await checkBriefInteractions(userId);
    console.log('✅ MANUAL: Brief Interaction Notifier completed');

    return apiSuccess({
      message: 'Brief interaction notifications processed manually',
      userId: userId ?? 'all',
    });
  } catch (error) {
    console.error('❌ MANUAL: Brief Interaction Notifier failed:', error);
    return apiError('Failed to process brief interaction notifications', 500);
  }
}
