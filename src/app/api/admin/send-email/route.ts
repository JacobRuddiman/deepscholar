// app/api/admin/send-email/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {getLocalSession } from '@/lib/localMode';
export async function POST(request: Request) {
  try {
    
    const session = getLocalSession();
    const { subject, body, footer, recipients } = await request.json();

    // Validate inputs
    if (!subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get recipient emails
    let recipientEmails: string[] = [];
    
    if (recipients === 'all') {
      const users = await prisma.user.findMany({
        where: { 
          email: { not: null },
          emailNotifications: true 
        },
        select: { email: true }
      });
      recipientEmails = users.map(u => u.email!).filter(Boolean);
    } else if (Array.isArray(recipients)) {
      // Handle both user IDs and email addresses
      const userIds = recipients.filter(r => !r.includes('@'));
      const directEmails = recipients.filter(r => r.includes('@'));
      
      if (userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { 
            id: { in: userIds },
            email: { not: null },
            emailNotifications: true
          },
          select: { email: true }
        });
        recipientEmails = [...users.map(u => u.email!).filter(Boolean), ...directEmails];
      } else {
        recipientEmails = directEmails;
      }
    }

    // Save email send record
    await prisma.emailSend.create({
      data: {
        subject,
        body,
        footer: footer || '',
        recipients: JSON.stringify(recipients),
        sentBy: session.user.id
      }
    });

    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Sending email:', {
      subject,
      to: recipientEmails,
      body: `${body}\n\n${footer}`,
      sentBy: session.user.email
    });

    return NextResponse.json({ 
      success: true, 
      recipientCount: recipientEmails.length 
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}