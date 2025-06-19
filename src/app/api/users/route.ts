/**
 * Users API Route
 * 
 * Handles fetching users with various filters
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

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            briefs: {
              where: {
                published: true,
                isActive: true,
                isDraft: false,
              },
            },
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email || '',
      createdAt: user.createdAt.toISOString(),
      _count: {
        briefs: user._count.briefs,
        reviews: user._count.reviews,
      },
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      total: transformedUsers.length,
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
