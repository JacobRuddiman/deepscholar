// app/api/admin/email-footer/route.ts
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    

    const footer = await prisma.emailFooter.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ content: footer?.content || '' });
  } catch (error) {
    console.error('Failed to fetch footer:', error);
    return NextResponse.json({ error: 'Failed to fetch footer' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    

    const { content } = await request.json();

    // Deactivate all existing footers
    await prisma.emailFooter.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new active footer
    const footer = await prisma.emailFooter.create({
      data: {
        content,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, footer });
  } catch (error) {
    console.error('Failed to save footer:', error);
    return NextResponse.json({ error: 'Failed to save footer' }, { status: 500 });
  }
}