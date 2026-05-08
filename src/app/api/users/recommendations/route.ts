import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const users = await prisma.userRecommendation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return apiSuccess(users);
  } catch (error) {
    console.error('Error fetching users with recommendations:', String(error));
    return apiError('Internal server error', 500);
  }
}
