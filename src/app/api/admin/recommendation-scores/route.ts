// app/api/admin/recommendation-scores/route.ts
import { NextRequest } from 'next/server';
import { calculateAllRecommendationScores } from '@/server/actions/recommendations';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const { userId } = await request.json();

    if (!userId) {
      return apiError('User ID is required', 400);
    }

    const scores = await calculateAllRecommendationScores(userId);

    return apiSuccess({ scores });
  } catch (error) {
    console.error('Error calculating recommendation scores:', String(error));
    return apiError('Failed to calculate recommendation scores', 500);
  }
}
