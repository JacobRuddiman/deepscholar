// app/api/admin/email-footer/route.ts
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const footer = await prisma.emailFooter.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return apiSuccess({ content: footer?.content || '' });
  } catch (error) {
    console.error('Failed to fetch footer:', String(error));
    return apiError('Failed to fetch footer', 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

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

    return apiSuccess({ footer });
  } catch (error) {
    console.error('Failed to save footer:', String(error));
    return apiError('Failed to save footer', 500);
  }
}
