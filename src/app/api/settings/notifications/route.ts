import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { apiSuccess, apiError, requireAuth, isApiError } from '@/lib/api-response';

type NotificationPreferences = {
  emailNotifications: boolean;
  briefInterestUpdates: boolean;
  promotionalNotifications: boolean;
};

// GET - Fetch user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailNotifications: true,
        briefInterestUpdates: true,
        promotionalNotifications: true,
      }
    });

    if (!user) {
      return apiError('User not found', 404);
    }

    // Default to true if fields don't exist yet (for backwards compatibility)
    const preferences: NotificationPreferences = {
      emailNotifications: user.emailNotifications ?? true,
      briefInterestUpdates: user.briefInterestUpdates ?? true,
      promotionalNotifications: user.promotionalNotifications ?? true,
    };

    return apiSuccess({ preferences });

  } catch (error) {
    console.error('Get notification preferences error:', String(error));
    return apiError('Failed to fetch notification preferences', 500);
  }
}

// POST - Update user's notification preferences
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (isApiError(session)) return session;

    const requestBody = await request.json() as NotificationPreferences;
    const { emailNotifications, briefInterestUpdates, promotionalNotifications } = requestBody;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      return apiError('User not found', 404);
    }

    // Update notification preferences
    await db.user.update({
      where: { id: user.id },
      data: {
        emailNotifications,
        briefInterestUpdates,
        promotionalNotifications
      }
    });

    return apiSuccess({ message: 'Notification preferences updated successfully' });

  } catch (error) {
    console.error('Update notification preferences error:', String(error));
    return apiError('Failed to update notification preferences', 500);
  }
}
