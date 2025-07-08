import { NextRequest, NextResponse } from 'next/server';
import { calculateAllRecommendationScores } from '@/server/actions/recommendations';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { isLocalMode, getLocalUser } from '@/lib/localMode';

export async function POST(request: NextRequest) {
  try {
    let currentUserId: string;
    let isAdmin = false;

    if (isLocalMode()) {
      const localUser = getLocalUser();
      if (!localUser) {
        return NextResponse.json(
          { success: false, error: 'Local user not found' },
          { status: 401 }
        );
      }
      currentUserId = localUser.id;
      isAdmin = true; // In local mode, assume admin access
    } else {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      currentUserId = session.user.id;

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { isAdmin: true }
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }
      isAdmin = true;
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const scores = await calculateAllRecommendationScores(userId);

    return NextResponse.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error calculating recommendation scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate recommendation scores' },
      { status: 500 }
    );
  }
}
