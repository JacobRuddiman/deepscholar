'use server';

import { db } from '@/server/db';
import { auth } from '@/server/auth';
import { LOCAL_MODE, LOCAL_USER } from '@/lib/localMode';

export interface BriefReference {
  id: string;
  briefId: string;
  sourceId: string;
  highlightedText: string;
  context?: string;
  source: {
    id: string;
    title: string;
    url: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export async function createBriefReference(
  briefId: string,
  sourceUrl: string,
  highlightedText: string,
  context?: string
) {
  try {
    // Handle authentication - use local user in local mode
    let userId: string;
    if (LOCAL_MODE) {
      userId = LOCAL_USER.id;
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
      }
      userId = session.user.id;
    }

    // Check if user owns the brief
    const brief = await db.brief.findUnique({
      where: { id: briefId },
      select: { userId: true }
    });

    if (!brief || brief.userId !== userId) {
      return { success: false, error: 'Not authorized to edit this brief' };
    }

    // Find or create the source
    let source = await db.source.findFirst({
      where: { url: sourceUrl }
    });

    if (!source) {
      // Extract title from URL or use URL as title
      const title = await extractTitleFromUrl(sourceUrl) || sourceUrl;
      source = await db.source.create({
        data: {
          url: sourceUrl,
          title: title
        }
      });
    }

    // Create the reference
    const reference = await db.briefReference.create({
      data: {
        briefId,
        sourceId: source.id,
        highlightedText,
        context
      },
      include: {
        source: true
      }
    });

    // Also connect the source to the brief if not already connected
    await db.brief.update({
      where: { id: briefId },
      data: {
        sources: {
          connect: { id: source.id }
        }
      }
    });

    return { success: true, data: reference };
  } catch (error) {
    console.error('Error creating brief reference:', error);
    return { success: false, error: 'Failed to create reference' };
  }
}

export async function getBriefReferences(briefId: string) {
  try {
    const references = await db.briefReference.findMany({
      where: { briefId },
      include: {
        source: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: references };
  } catch (error) {
    console.error('Error fetching brief references:', error);
    return { success: false, error: 'Failed to fetch references' };
  }
}

export async function deleteBriefReference(referenceId: string) {
  try {
    // Handle authentication - use local user in local mode
    let userId: string;
    if (LOCAL_MODE) {
      userId = LOCAL_USER.id;
    } else {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
      }
      userId = session.user.id;
    }

    // Check if user owns the brief that contains this reference
    const reference = await db.briefReference.findUnique({
      where: { id: referenceId },
      include: {
        brief: {
          select: { userId: true }
        }
      }
    });

    if (!reference || reference.brief.userId !== userId) {
      return { success: false, error: 'Not authorized to delete this reference' };
    }

    await db.briefReference.delete({
      where: { id: referenceId }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting brief reference:', error);
    return { success: false, error: 'Failed to delete reference' };
  }
}

// Helper function to extract title from URL
async function extractTitleFromUrl(url: string): Promise<string | null> {
  try {
    // For now, just extract domain name as title
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}
