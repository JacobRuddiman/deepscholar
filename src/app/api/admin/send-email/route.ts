import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

// Helper function to format email-like console log
function logEmail(to: string, subject: string, body: string, footer: string) {
  console.log('\n' + '='.repeat(80));
  console.log('📧 ADMIN EMAIL NOTIFICATION');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-'.repeat(80));
  console.log(body);
  console.log('-'.repeat(80));
  console.log(footer);
  console.log('='.repeat(80) + '\n');
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as {
      subject: string;
      body: string;
      footer: string;
      recipients: string | string[];
    };
    const { subject, body, footer, recipients } = requestBody;

    if (!subject || !body) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    let users;
    if (recipients === 'all') {
      users = await db.user.findMany({
        where: {
          email: { not: null }
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } else if (Array.isArray(recipients)) {
      users = await db.user.findMany({
        where: {
          id: { in: recipients },
          email: { not: null }
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid recipients format' },
        { status: 400 }
      );
    }

    console.log(`📧 ADMIN: Sending email to ${users.length} users`);
    console.log(`📧 Subject: ${subject}`);

    // Send email to each user (console log for now)
    for (const user of users) {
      const personalizedBody = body.replace(/\{name\}/g, user.name ?? 'Researcher');
      logEmail(
        user.email ?? `${user.name} (${user.id})`,
        subject,
        personalizedBody,
        footer
      );
    }

    console.log(`✅ ADMIN: Email sent to ${users.length} users`);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${users.length} users`,
      recipientCount: users.length,
    });
  } catch (error) {
    console.error('❌ ADMIN: Send email failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
