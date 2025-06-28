// app/api/cron/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verify cron secret (set this in your environment variables)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find emails that should be sent now
    const emailsToSend = await prisma.scheduledEmail.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: new Date()
        }
      },
      include: {
        sentByUser: true
      }
    });

    // Process each email
    for (const email of emailsToSend) {
      try {
        const recipients = JSON.parse(email.recipients);
        
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

        // Send the email (integrate with your email service)
        console.log('Sending scheduled email:', {
          subject: email.subject,
          to: recipientEmails,
          body: `${email.body}\n\n${email.footer}`
        });

        // Update email status
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        });

        // Create email send record
        await prisma.emailSend.create({
          data: {
            subject: email.subject,
            body: email.body,
            footer: email.footer,
            recipients: email.recipients,
            sentBy: email.sentBy
          }
        });

      } catch (error) {
        console.error(`Failed to send scheduled email ${email.id}:`, error);
        
        // Update email status to failed
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: emailsToSend.length 
    });
  } catch (error) {
    console.error('Failed to process scheduled emails:', error);
    return NextResponse.json({ error: 'Failed to process scheduled emails' }, { status: 500 });
  }
}