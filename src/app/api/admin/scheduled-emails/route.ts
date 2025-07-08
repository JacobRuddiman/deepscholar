// app/api/admin/scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/server/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json({ scheduledEmails });
  } catch (error) {
    console.error('Failed to fetch scheduled emails:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, body, footer, recipients, scheduledFor } = await request.json();

    // Validate inputs
    if (!subject || !body || !recipients || !scheduledFor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json({ 
      success: true, 
      scheduledEmail 
    });
  } catch (error) {
    console.error('Failed to schedule email:', error);
    return NextResponse.json({ error: 'Failed to schedule email' }, { status: 500 });
  }
}

// Cancel scheduled email
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing email ID' }, { status: 400 });
    }

    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel scheduled email:', error);
    return NextResponse.json({ error: 'Failed to cancel email' }, { status: 500 });
  }
}
