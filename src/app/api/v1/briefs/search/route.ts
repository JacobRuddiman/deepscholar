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

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get('q')?.trim();

    if (!q || q.length < 2) {
      return apiError('Query parameter "q" is required and must be at least 2 characters', 400);
    }

    const page = clamp(parseInt(params.get('page') || '1'), 1, 500);
    const limit = clamp(parseInt(params.get('limit') || '20'), 1, 100);
    const sort = params.get('sort') || 'recent';
    const category = params.get('category');
    const model = params.get('model');
    const skip = (page - 1) * limit;

    const isSqlite = process.env.DATABASE_URL?.startsWith('file:');
    const contains = isSqlite
      ? { contains: q }
      : { contains: q, mode: 'insensitive' as const };

    const where = {
      ...PUBLISHED,
      OR: [
        { title: contains },
        { abstract: contains },
      ],
      ...(category ? { categories: { some: { id: category } } } : {}),
      ...(model ? { modelId: model } : {}),
    };

    let orderBy;
    switch (sort) {
      case 'popular': orderBy = { viewCount: 'desc' as const }; break;
      case 'top-rated': orderBy = { reviews: { _count: 'desc' as const } }; break;
      default: orderBy = { createdAt: 'desc' as const };
    }

    const [briefs, total] = await Promise.all([
      prisma.brief.findMany({
        where,
        select: BRIEF_SELECT,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.brief.count({ where }),
    ]);

    return apiSuccess({
      briefs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query: q,
    });
  } catch (error) {
    console.error('v1/briefs/search error:', String(error));
    return apiError('Internal server error', 500);
  }
}
