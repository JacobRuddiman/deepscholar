import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = clamp(parseInt(searchParams.get('page') || '1'), 1, 500);
    const limit = clamp(parseInt(searchParams.get('limit') || '20'), 1, 100);
    const skip = (page - 1) * limit;

    // Verify the brief exists and is published
    const brief = await prisma.brief.findFirst({
      where: {
        ...PUBLISHED,
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!brief) {
      return apiError('Brief not found', 404);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { briefId: brief.id },
        select: {
          id: true,
          content: true,
          rating: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { briefId: brief.id } }),
    ]);

    return apiSuccess({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('v1/briefs/[id]/reviews error:', String(error));
    return apiError('Internal server error', 500);
  }
}
