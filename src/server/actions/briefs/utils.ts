'use server';

import { auth } from '@/server/auth';
import { isLocalAuth, LOCAL_USER } from '@/lib/localMode';

/**
 * Get the current user's ID with LOCAL_AUTH mode support
 * @throws {Error} If not authenticated in production mode
 * @returns {Promise<string>} The user ID
 */
export async function getUserId(): Promise<string> {
  if (isLocalAuth()) {
    return LOCAL_USER.id;
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return session.user.id;
}

/**
 * Check if the current user owns a resource
 * @param resourceUserId - The userId of the resource to check
 * @returns {Promise<boolean>} True if the user owns the resource
 */
export async function isResourceOwner(resourceUserId: string): Promise<boolean> {
  try {
    const currentUserId = await getUserId();
    return currentUserId === resourceUserId;
  } catch {
    return false;
  }
}