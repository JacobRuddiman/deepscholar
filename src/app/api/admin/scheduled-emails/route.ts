// app/api/admin/scheduled-emails/route.ts
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const scheduledEmails = await prisma.scheduledEmail.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          gte: new Date()
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      include: {
        sentByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return apiSuccess({ scheduledEmails });
  } catch (error) {
    console.error('Failed to fetch scheduled emails:', String(error));
    return apiError('Failed to fetch scheduled emails', 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const { subject, body, footer, recipients, scheduledFor } = await request.json();

    // Validate inputs
    if (!subject || !body || !recipients || !scheduledFor) {
      return apiError('Missing required fields', 400);
    }

    // Create scheduled email
    const scheduledEmail = await prisma.scheduledEmail.create({
      data: {
        subject,
        body,
        footer: footer || '',
        recipients: JSON.stringify(recipients),
        scheduledFor: new Date(scheduledFor),
        sentBy: session.user.id
      }
    });

    return apiSuccess({ scheduledEmail });
  } catch (error) {
    console.error('Failed to schedule email:', String(error));
    return apiError('Failed to schedule email', 500);
  }
}

// Cancel scheduled email
export async function DELETE(request: Request) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('Missing email ID', 400);
    }

    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    return apiSuccess({ cancelled: true });
  } catch (error) {
    console.error('Failed to cancel scheduled email:', String(error));
    return apiError('Failed to cancel email', 500);
  }
}
