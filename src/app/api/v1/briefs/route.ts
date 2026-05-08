import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

const BRIEF_SELECT = {
  id: true, title: true, abstract: true, slug: true,
  viewCount: true, readTime: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, name: true, image: true } },
  model: { select: { id: true, name: true, provider: true } },
  categories: { select: { id: true, name: true } },
  _count: { select: { reviews: true, upvotes: true } },
} as const;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

type SortOption = 'popular' | 'recent' | 'top-rated';

function getOrderBy(sort: SortOption) {
  switch (sort) {
    case 'popular': return { viewCount: 'desc' as const };
    case 'top-rated': return { reviews: { _count: 'desc' as const } };
    case 'recent':
    default: return { createdAt: 'desc' as const };
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = clamp(parseInt(params.get('page') || '1'), 1, 500);
    const limit = clamp(parseInt(params.get('limit') || '20'), 1, 100);
    const sort = (params.get('sort') || 'recent') as SortOption;
    const skip = (page - 1) * limit;

    const [briefs, total] = await Promise.all([
      prisma.brief.findMany({
        where: PUBLISHED,
        select: BRIEF_SELECT,
        orderBy: getOrderBy(sort),
        skip,
        take: limit,
      }),
      prisma.brief.count({ where: PUBLISHED }),
    ]);

    return apiSuccess({
      briefs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('v1/briefs error:', String(error));
    return apiError('Internal server error', 500);
  }
}
