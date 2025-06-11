import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { auth } from '@/server/auth';

type NotificationPreferences = {
  emailNotifications: boolean;
  briefInterestUpdates: boolean;
  promotionalNotifications: boolean;
};

// GET - Fetch user's notification preferences
export async function GET(request: NextRequest) {
  try {
    // In LOCAL MODE, use the demo user
    const user = await db.user.findUnique({
      where: { email: 'demo@localhost' },
      select: {
        id: true,
        emailNotifications: true,
        briefInterestUpdates: true,
        promotionalNotifications: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Default to true if fields don't exist yet (for backwards compatibility)
    const preferences: NotificationPreferences = {
      emailNotifications: user.emailNotifications ?? true,
      briefInterestUpdates: user.briefInterestUpdates ?? true,
      promotionalNotifications: user.promotionalNotifications ?? true,
    };

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('❌ Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// POST - Update user's notification preferences
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as NotificationPreferences;
    const { emailNotifications, briefInterestUpdates, promotionalNotifications } = requestBody;

    // In LOCAL MODE, use the demo user
    const user = await db.user.findUnique({
      where: { email: 'demo@localhost' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
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

    console.log('\n' + '='.repeat(80));
    console.log('⚙️  NOTIFICATION PREFERENCES UPDATED');
    console.log('='.repeat(80));
    console.log(`User: ${user.name ?? 'Anonymous'}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Email Notifications: ${emailNotifications}`);
    console.log(`Brief Interest Updates: ${briefInterestUpdates}`);
    console.log(`Promotional Notifications: ${promotionalNotifications}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('❌ Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
