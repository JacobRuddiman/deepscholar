//admin/api/users/route.ts

import { db } from '@/server/db';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailNotifications: true,
        briefInterestUpdates: true,
        promotionalNotifications: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return apiSuccess({ users });
  } catch (error) {
    console.error('Error fetching users:', String(error));
    return apiError('Failed to fetch users', 500);
  }
}
