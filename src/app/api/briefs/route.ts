/**
 * Briefs API Route
 *
 * Handles fetching briefs with various filters
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: Prisma.BriefWhereInput = {
      published: true,
      isDraft: false,
    };

    // Filter by active status if specified
    if (isActive === 'true') {
      where.isActive = true;
    }

    // Filter by user if specified
    if (userId) {
      where.userId = userId;
    }

    const briefs = await db.brief.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          select: {
            name: true,
          },
        },
        upvotes: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            viewedBy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform the data to match the expected format
    const transformedBriefs = briefs.map(brief => ({
      id: brief.id,
      title: brief.title,
      abstract: brief.abstract,
      author: {
        name: brief.author.name || 'Anonymous',
      },
      createdAt: brief.createdAt.toISOString(),
      viewCount: brief._count.viewedBy,
      userId: brief.userId,
      upvotes: brief.upvotes.length,
      reviewCount: brief._count.reviews,
      categories: brief.categories.map(cat => cat.name),
    }));

    return apiSuccess({
      briefs: transformedBriefs,
      total: transformedBriefs.length,
    });

  } catch (error) {
    console.error('Briefs API error:', String(error));
    return apiError('Internal server error', 500);
  }
}
