import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

const PUBLISHED = { published: true, isActive: true, isDraft: false } as const;

export async function GET() {
  try {
    const raw = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { briefs: { where: PUBLISHED } } },
      },
      orderBy: { briefs: { _count: 'desc' } },
    });

    const categories = raw.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      briefCount: c._count.briefs,
    }));

    return apiSuccess({ categories });
  } catch (error) {
    console.error('v1/categories error:', String(error));
    return apiError('Internal server error', 500);
  }
}
