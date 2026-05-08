import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/server/auth';
import { isLocalMode, getLocalSession } from '@/lib/localMode';

/**
 * Standardized API response utilities.
 *
 * Success: { success: true, data, timestamp }
 * Error:   { success: false, error: { message, code? }, timestamp }
 */

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true as const, data, timestamp: new Date().toISOString() },
    { status },
  );
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false as const,
      error: { message, ...(code ? { code } : {}) },
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

/**
 * Require an authenticated session. Supports local mode.
 * Returns the session or a 401 NextResponse.
 */
export async function requireAuth(): Promise<Session | NextResponse> {
  let session: Session | null = null;

  if (isLocalMode()) {
    session = getLocalSession() as Session | null;
  } else {
    session = await auth();
  }

  if (!session?.user?.id) {
    return apiError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  return session;
}

/**
 * Require an admin session. Returns 401 if not logged in, 403 if not admin.
 */
export async function requireAdmin(): Promise<Session | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!(result.user as { isAdmin?: boolean }).isAdmin) {
    return apiError('Admin access required', 403, 'FORBIDDEN');
  }

  return result;
}

/** Type guard: check if requireAuth/requireAdmin returned an error response */
export function isApiError(result: Session | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
