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
    const limit = clamp(parseInt(params.get('limit') || '10'), 1, 50);

    const briefs = await prisma.brief.findMany({
      where: PUBLISHED,
      select: BRIEF_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return apiSuccess({ briefs });
  } catch (error) {
    console.error('v1/briefs/recent error:', String(error));
    return apiError('Internal server error', 500);
  }
}
