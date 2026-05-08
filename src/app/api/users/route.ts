/**
 * Users API Route
 *
 * Handles fetching users with various filters
 */

import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

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

    return apiSuccess({
      users: transformedUsers,
      total: transformedUsers.length,
    });

  } catch (error) {
    console.error('Users API error:', String(error));
    return apiError('Internal server error', 500);
  }
}
