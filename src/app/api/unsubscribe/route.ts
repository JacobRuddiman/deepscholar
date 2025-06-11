import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as { email: string };
    const { email } = requestBody;

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email address not found in our system. You may already be unsubscribed or never subscribed to our emails.' 
        },
        { status: 404 }
      );
    }

    // For now, we'll just log the unsubscribe request since we don't have an unsubscribed field
    // In a real implementation, you'd add an 'unsubscribed' field to the User model
    console.log('\n' + '='.repeat(80));
    console.log('📧 UNSUBSCRIBE REQUEST');
    console.log('='.repeat(80));
    console.log(`User: ${user.name ?? 'Anonymous'}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('Status: UNSUBSCRIBED FROM ALL EMAIL NOTIFICATIONS');
    console.log('='.repeat(80) + '\n');

    // Update user's email notification preferences
    await db.user.update({
      where: { id: user.id },
      data: { 
        emailNotifications: false,
        briefInterestUpdates: false,
        promotionalNotifications: false
      }
    });

    return NextResponse.json({
      success: true,
      message: `${user.email} has been successfully unsubscribed from all DeepScholar email notifications.`
    });

  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your unsubscribe request. Please try again.' },
      { status: 500 }
    );
  }
}

// GET handler for unsubscribe links with email parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      // Redirect to unsubscribe page without email
      return NextResponse.redirect(new URL('/unsubscribe', request.url));
    }

    // Redirect to unsubscribe page with email parameter
    return NextResponse.redirect(new URL(`/unsubscribe?email=${encodeURIComponent(email)}`, request.url));

  } catch (error) {
    console.error('❌ Unsubscribe GET error:', error);
    return NextResponse.redirect(new URL('/unsubscribe', request.url));
  }
}
