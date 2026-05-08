import { NextRequest } from 'next/server';
import { getPersonalizedRecommendations } from '@/server/actions/recommendations';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);

    const recommendations = await getPersonalizedRecommendations(userId, limit);

    return apiSuccess(recommendations);
  } catch (error) {
    console.error('[API] Failed to fetch personalized recommendations:', error);
    return apiError('Failed to fetch recommendations', 500);
  }
}
