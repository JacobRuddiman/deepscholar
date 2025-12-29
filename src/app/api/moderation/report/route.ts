import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/server/auth';

/**
 * API endpoint for submitting content reports
 *
 * @route POST /api/moderation/report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, reason, details } = body;

    // Validate input
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes = ['brief', 'review', 'comment', 'user'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // TODO: Create a Report model in Prisma schema
    // For now, just log the report
    console.log('[Moderation] Report submitted:', {
      userId: session.user.id,
      contentType,
      contentId,
      reason,
      details,
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, you would:
    // 1. Create a report record in the database
    // 2. Send notification to moderators
    // 3. Possibly auto-flag content based on number of reports
    // 4. Track reporting user to prevent abuse

    // Example (requires Report model):
    // await prisma.report.create({
    //   data: {
    //     userId: session.user.id,
    //     contentType,
    //     contentId,
    //     reason,
    //     details,
    //     status: 'pending',
    //   },
    // });

    return NextResponse.json(
      { success: true, message: 'Report submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Moderation] Failed to submit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
