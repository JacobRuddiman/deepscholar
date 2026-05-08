import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as { email: string };
    const { email } = requestBody;

    if (!email?.trim()) {
      return apiError('Email address is required', 400);
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Attempt to unsubscribe the user. Silently handle the case where the email
    // does not exist to avoid revealing whether an email is registered.
    try {
      await db.user.update({
        where: { email: trimmedEmail },
        data: {
          emailNotifications: false,
          briefInterestUpdates: false,
          promotionalNotifications: false
        }
      });
    } catch (updateError) {
      // Silently ignore "record not found" errors to prevent email enumeration.
      // Prisma throws P2025 when the record to update is not found.
      if (
        updateError &&
        typeof updateError === 'object' &&
        'code' in updateError &&
        (updateError as { code: string }).code === 'P2025'
      ) {
        // Email not found — do nothing, return success below
      } else {
        throw updateError;
      }
    }

    // Always return the same success response regardless of whether the email was found
    return apiSuccess({
      message: 'If this email is registered, it has been unsubscribed from all DeepScholar email notifications.'
    });

  } catch (error) {
    console.error('Unsubscribe error:', String(error));
    return apiError('An error occurred while processing your unsubscribe request. Please try again.', 500);
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
    console.error('Unsubscribe GET error:', error);
    return NextResponse.redirect(new URL('/unsubscribe', request.url));
  }
}
