import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedRecommendations } from '@/server/actions/recommendations';
import { auth } from '@/server/auth';
import { isLocalAuth, getLocalUser } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  try {
    console.log('[Recommendations API] Starting request');
    let userId: string;

    if (isLocalAuth()) {
      console.log('[Recommendations API] Running in local auth mode');
      const localUser = getLocalUser();
      if (!localUser) {
        console.error('[Recommendations API] Local user not found');
        return NextResponse.json(
          { success: false, error: 'Local user not found' },
          { status: 401 }
        );
      }
      userId = localUser.id;
      console.log('[Recommendations API] Using local user ID:', userId);
    } else {
      console.log('[Recommendations API] Authenticating user...');
      let session;
      try {
        session = await auth();
        console.log('[Recommendations API] Auth completed, session:', session ? 'exists' : 'null');
      } catch (authError) {
        console.error('[Recommendations API] Auth error:', authError);
        throw authError;
      }

      if (!session?.user?.id) {
        console.error('[Recommendations API] No valid session or user ID');
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      console.log('[Recommendations API] Authenticated user ID:', userId);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');
    console.log('[Recommendations API] Fetching recommendations with limit:', limit);

    const recommendations = await getPersonalizedRecommendations(userId, limit);
    console.log('[Recommendations API] Successfully fetched', recommendations.length, 'recommendations');

    return NextResponse.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('[API] Failed to fetch personalized recommendations - Full error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
