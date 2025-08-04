'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { sanitizeHtml, sanitizeText } from '@/lib/validation';
import { getUserId } from './utils';

// Get all versions of a brief
export async function getBriefVersions(briefId: string) {
  try {
    const userId = await getUserId();

    // Get the root brief (original or any version to find the parent)
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        id: true, 
        parentBriefId: true, 
        userId: true,
        versionNumber: true 
      },
    });

    if (!brief) {
      return {
        success: false,
        error: 'Brief not found',
      };
    }

    // Find the root brief ID (either this brief if it's the original, or its parent)
    const rootBriefId = brief.parentBriefId ?? brief.id;

    // Get all versions (including the root brief)
    const versions = await prisma.brief.findMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ]
      },
      select: {
        id: true,
        versionNumber: true,
        changeLog: true,
        createdAt: true,
        updatedAt: true,
        isDraft: true,
        isActive: true,
        userId: true,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    return {
      success: true,
      data: versions,
      isOwner: brief.userId === userId,
    };
  } catch (error) {
    console.error('Error fetching brief versions:', error);
    return {
      success: false,
      error: 'Failed to fetch brief versions',
    };
  }
}

// Create a new version of a brief
export async function createBriefVersion(
  parentBriefId: string, 
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  },
  changeLog: string
) {
  try {
    const userId = await getUserId();

    // Verify ownership of the parent brief
    const parentBrief = await prisma.brief.findUnique({
      where: { id: parentBriefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        modelId: true,
        versionNumber: true 
      },
    });

    if (!parentBrief || parentBrief.userId !== userId) {
      throw new Error('Not authorized to create version of this brief');
    }

    // Find the root brief ID and get the highest version number
    const rootBriefId = parentBrief.parentBriefId ?? parentBriefId;
    
    const highestVersion = await prisma.brief.findFirst({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ]
      },
      orderBy: {
        versionNumber: 'desc',
      },
      select: {
        versionNumber: true,
      },
    });

    const newVersionNumber = (highestVersion?.versionNumber ?? 0) + 1;

    // First, set all existing versions in this brief family to inactive
    await prisma.brief.updateMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ],
        isDraft: false, // Only update published versions
      },
      data: {
        isActive: false,
      },
    });

    // Create the new version
    const newVersion = await prisma.brief.create({
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        modelId: parentBrief.modelId,
        userId: userId,
        parentBriefId: rootBriefId,
        versionNumber: newVersionNumber,
        changeLog: changeLog,
        isDraft: false,
        published: true,
        isActive: true, // New versions are active by default
        ...(briefData.categoryIds && {
          categories: {
            connect: briefData.categoryIds.map((id: string) => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            connect: briefData.sourceIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
        sources: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    revalidatePath('/my-briefs');
    revalidatePath(`/briefs/${parentBriefId}`);
    revalidatePath(`/briefs/${newVersion.id}`);

    return {
      success: true,
      data: newVersion,
    };
  } catch (error) {
    console.error('Error creating brief version:', error);
    return {
      success: false,
      error: 'Failed to create brief version',
    };
  }
}

// Update an existing version or draft
export async function updateBriefVersion(
  briefId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        isDraft: true 
      },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to update this brief');
    }

    // Update the brief
    const updatedBrief = await prisma.brief.update({
      where: { id: briefId },
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        ...(briefData.categoryIds && {
          categories: {
            set: briefData.categoryIds.map(id => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            set: briefData.sourceIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
        sources: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedBrief,
    };
  } catch (error) {
    console.error('Error updating brief version:', error);
    return {
      success: false,
      error: 'Failed to update brief version',
    };
  }
}

// Save current edits as a draft version
export async function saveBriefDraft(
  briefId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Get the current brief to determine its version structure
    const currentBrief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        modelId: true,
        versionNumber: true,
        isDraft: true
      },
    });

    if (!currentBrief || currentBrief.userId !== userId) {
      throw new Error('Not authorized to save draft of this brief');
    }

    // Determine the correct version number and root brief ID
    let targetVersionNumber: number;
    let rootBriefId: string;

    if (currentBrief.isDraft) {
      // If current is already a draft, use its version number and parent
      targetVersionNumber = currentBrief.versionNumber;
      rootBriefId = currentBrief.parentBriefId ?? briefId;
    } else {
      // If current is a published version, use its version number
      targetVersionNumber = currentBrief.versionNumber;
      rootBriefId = currentBrief.parentBriefId ?? briefId;
    }
    
    // Get existing drafts for this specific version to determine draft number
    const existingDrafts = await prisma.brief.findMany({
      where: {
        parentBriefId: rootBriefId,
        versionNumber: targetVersionNumber,
        isDraft: true,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if we can create a new draft (max 3 drafts per version)
    if (existingDrafts.length >= 3) {
      // Update the oldest draft instead
      const oldestDraft = existingDrafts[existingDrafts.length - 1];
      if (!oldestDraft) {
        throw new Error('Failed to find oldest draft');
      }
      
      const updatedDraft = await prisma.brief.update({
        where: { id: oldestDraft.id },
        data: {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: briefData.prompt,
          response: briefData.response,
          thinking: briefData.thinking,
          changeLog: `Draft changes - ${new Date().toLocaleString()}`,
          ...(briefData.categoryIds && {
            categories: {
              set: briefData.categoryIds.map(id => ({ id })),
            },
          }),
          ...(briefData.sourceIds && {
            sources: {
              set: briefData.sourceIds.map(id => ({ id })),
            },
          }),
        },
        include: {
          categories: true,
          sources: true,
          model: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedDraft,
      };
    } else {
      // Create new draft with the correct version number
      const draft = await prisma.brief.create({
        data: {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: briefData.prompt,
          response: briefData.response,
          thinking: briefData.thinking,
          modelId: currentBrief.modelId,
          userId: userId,
          parentBriefId: rootBriefId,
          versionNumber: targetVersionNumber,
          isDraft: true,
          published: false,
          changeLog: `Draft ${existingDrafts.length + 1} - ${new Date().toLocaleString()}`,
          ...(briefData.categoryIds && {
            categories: {
              connect: briefData.categoryIds.map(id => ({ id })),
            },
          }),
          ...(briefData.sourceIds && {
            sources: {
              connect: briefData.sourceIds.map(id => ({ id })),
            },
          }),
        },
        include: {
          categories: true,
          sources: true,
          model: true,
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return {
        success: true,
        data: draft,
      };
    }
  } catch (error) {
    console.error('Error saving brief draft:', error);
    return {
      success: false,
      error: 'Failed to save brief draft',
    };
  }
}

// Push draft to version (update version with draft content and delete draft)
export async function pushDraftToVersion(
  draftId: string,
  briefData: {
    title: string;
    abstract?: string;
    prompt: string;
    response: string;
    thinking?: string;
    categoryIds?: string[];
    sourceIds?: string[];
  }
) {
  try {
    const userId = await getUserId();

    // Get the draft
    const draft = await prisma.brief.findUnique({
      where: { id: draftId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        versionNumber: true,
        isDraft: true 
      },
    });

    if (!draft || draft.userId !== userId || !draft.isDraft) {
      throw new Error('Not authorized or invalid draft');
    }

    // Find the published version for this version number
    const publishedVersion = await prisma.brief.findFirst({
      where: {
        OR: [
          ...(draft.parentBriefId ? [{ id: draft.parentBriefId }] : []),
          ...(draft.parentBriefId ? [{ parentBriefId: draft.parentBriefId }] : [])
        ],
        versionNumber: draft.versionNumber,
        isDraft: false,
      },
    });

    if (!publishedVersion) {
      throw new Error('Published version not found');
    }

    // Update the published version with draft content
    const updatedVersion = await prisma.brief.update({
      where: { id: publishedVersion.id },
      data: {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.prompt,
        response: briefData.response,
        thinking: briefData.thinking,
        ...(briefData.categoryIds && {
          categories: {
            set: briefData.categoryIds.map(id => ({ id })),
          },
        }),
        ...(briefData.sourceIds && {
          sources: {
            set: briefData.sourceIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
        sources: true,
        model: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Delete the draft
    await prisma.brief.delete({
      where: { id: draftId },
    });

    return {
      success: true,
      data: updatedVersion,
    };
  } catch (error) {
    console.error('Error pushing draft to version:', error);
    return {
      success: false,
      error: 'Failed to push draft to version',
    };
  }
}

// Rename a version
export async function renameBriefVersion(
  briefId: string,
  newChangeLog: string
) {
  try {
    const userId = await getUserId();

    // Verify ownership
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { userId: true },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to rename this version');
    }

    // Update the change log
    const updatedBrief = await prisma.brief.update({
      where: { id: briefId },
      data: {
        changeLog: newChangeLog,
      },
    });

    return {
      success: true,
      data: updatedBrief,
    };
  } catch (error) {
    console.error('Error renaming brief version:', error);
    return {
      success: false,
      error: 'Failed to rename version',
    };
  }
}

// Set a version as the active version (only one can be active per brief family)
export async function setActiveVersion(briefId: string) {
  try {
    const userId = await getUserId();

    // Get the brief to check ownership and determine the root brief
    const brief = await prisma.brief.findUnique({
      where: { id: briefId },
      select: { 
        userId: true, 
        parentBriefId: true, 
        isDraft: true,
        versionNumber: true 
      },
    });

    if (!brief || brief.userId !== userId) {
      throw new Error('Not authorized to set active version for this brief');
    }

    // Drafts cannot be set as active
    if (brief.isDraft) {
      throw new Error('Drafts cannot be set as the active version');
    }

    // Find the root brief ID
    const rootBriefId = brief.parentBriefId ?? briefId;

    // First, set all versions in this brief family to inactive
    await prisma.brief.updateMany({
      where: {
        OR: [
          { id: rootBriefId },
          { parentBriefId: rootBriefId }
        ],
        isDraft: false, // Only update published versions
      },
      data: {
        isActive: false,
      },
    });

    // Then set the specified version as active
    await prisma.brief.update({
      where: { id: briefId },
      data: {
        isActive: true,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error setting active version:', error);
    return {
      success: false,
      error: 'Failed to set active version',
    };
  }
}