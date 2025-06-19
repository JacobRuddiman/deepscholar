/**
 * Briefs API Route
 * 
 * Handles fetching briefs with various filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

export async function GET(request: NextRequest) {
  try {
    // Get authentication (handle local mode)
    let session;
    if (isLocalMode()) {
      session = getLocalSession();
    } else {
      session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
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

    return NextResponse.json({
      success: true,
      briefs: transformedBriefs,
      total: transformedBriefs.length,
    });

  } catch (error) {
    console.error('Briefs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
