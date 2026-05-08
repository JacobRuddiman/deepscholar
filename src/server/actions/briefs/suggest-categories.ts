'use server';

import { prisma } from '@/lib/prisma';
import { autoTagBrief } from '@/lib/auto-tagger';

interface SuggestInput {
  title: string;
  abstract: string;
  response: string;
  prompt: string;
  sourceUrls: string[];
}

/**
 * Run the auto-tagger and return matching Category records.
 * Called from the upload editor after extraction completes.
 */
export async function suggestCategories(input: SuggestInput): Promise<{
  success: boolean;
  data?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const result = autoTagBrief({
      title: input.title,
      abstract: input.abstract,
      response: input.response,
      prompt: input.prompt,
      sourceUrls: input.sourceUrls,
      htmlContent: input.response,
    });

    if (result.categories.length === 0) {
      return { success: true, data: [] };
    }

    const records = await prisma.category.findMany({
      where: { name: { in: result.categories } },
      select: { id: true, name: true },
    });

    return { success: true, data: records };
  } catch (error) {
    console.error('[Briefs] suggestCategories failed:', String(error));
    return { success: false, error: 'Failed to suggest categories' };
  }
}
