import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

export async function GET() {
  try {
    const raw = await prisma.researchAIModel.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        _count: { select: { briefs: { where: PUBLISHED } } },
      },
      orderBy: { briefs: { _count: 'desc' } },
    });

    const models = raw.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      briefCount: m._count.briefs,
    }));

    return apiSuccess({ models });
  } catch (error) {
    console.error('v1/models error:', String(error));
    return apiError('Internal server error', 500);
  }
}
