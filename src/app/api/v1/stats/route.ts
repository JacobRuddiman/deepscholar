import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

export async function GET() {
  try {
    const [briefs, users, reviews, categories] = await Promise.all([
      prisma.brief.count({ where: PUBLISHED }),
      prisma.user.count(),
      prisma.review.count(),
      prisma.category.count(),
    ]);

    return apiSuccess({ briefs, users, reviews, categories });
  } catch (error) {
    console.error('v1/stats error:', String(error));
    return apiError('Internal server error', 500);
  }
}
