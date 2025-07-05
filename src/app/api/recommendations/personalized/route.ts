import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedRecommendations } from '@/server/actions/recommendations';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isLocalMode, getLocalUser } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  try {
    let userId: string;

    if (isLocalMode()) {
      const localUser = getLocalUser();
      if (!localUser) {
        return NextResponse.json(
          { success: false, error: 'Local user not found' },
          { status: 401 }
        );
      }
      userId = localUser.id;
    } else {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');

    const recommendations = await getPersonalizedRecommendations(userId, limit);

    return NextResponse.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
