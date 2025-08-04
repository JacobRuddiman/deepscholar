'use server';

import { auth } from '@/server/auth';

// Helper function to get user ID with LOCAL mode support
export async function getUserId() {
  const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
  
  if (isLocalMode) {
    return 'local-user-1';
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }
    return session.user.id;
  }
}