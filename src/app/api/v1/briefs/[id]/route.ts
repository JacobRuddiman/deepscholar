import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const brief = await prisma.brief.findFirst({
      where: {
        ...PUBLISHED,
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        prompt: true,
        response: true,
        slug: true,
        viewCount: true,
        readTime: true,
        accuracy: true,
        referencesText: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, image: true } },
        model: { select: { id: true, name: true, provider: true } },
        categories: { select: { id: true, name: true } },
        sources: { select: { id: true, title: true, url: true } },
        _count: { select: { reviews: true, upvotes: true } },
      },
    });

    if (!brief) {
      return apiError('Brief not found', 404);
    }

    return apiSuccess({ brief });
  } catch (error) {
    console.error('v1/briefs/[id] error:', String(error));
    return apiError('Internal server error', 500);
  }
}
