import { RecommendationService } from '@/server/services/recommendations';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    // Verify cron secret if you have one
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }

    const result = await RecommendationService.calculateAllUserRecommendations();

    return apiSuccess(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return apiError('Failed to update recommendations', 500);
  }
}
