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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = clamp(parseInt(searchParams.get('page') || '1'), 1, 500);
    const limit = clamp(parseInt(searchParams.get('limit') || '20'), 1, 100);
    const sort = searchParams.get('sort') || 'recent';
    const skip = (page - 1) * limit;

    // Find category by ID or name
    const category = await prisma.category.findFirst({
      where: { OR: [{ id }, { name: id }] },
      select: { id: true },
    });

    if (!category) {
      return apiError('Category not found', 404);
    }

    const where = {
      ...PUBLISHED,
      categories: { some: { id: category.id } },
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
    });
  } catch (error) {
    console.error('v1/categories/[id]/briefs error:', String(error));
    return apiError('Internal server error', 500);
  }
}
