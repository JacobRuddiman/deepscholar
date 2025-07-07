import { NextResponse } from 'next/server';
import { RecommendationService } from '@/server/services/recommendations';

export async function GET(request: Request) {
  try {
    // Verify cron secret if you have one
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await RecommendationService.calculateAllUserRecommendations();
    
    return NextResponse.json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update recommendations'
    }, { status: 500 });
  }
}
