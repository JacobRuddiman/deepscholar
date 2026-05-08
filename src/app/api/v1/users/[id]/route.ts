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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            briefs: { where: PUBLISHED },
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return apiError('User not found', 404);
    }

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        briefCount: user._count.briefs,
        reviewCount: user._count.reviews,
      },
    });
  } catch (error) {
    console.error('v1/users/[id] error:', String(error));
    return apiError('Internal server error', 500);
  }
}
