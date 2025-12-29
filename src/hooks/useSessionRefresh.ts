import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to automatically refresh session before it expires
 * Prevents users from being logged out while actively using the app
 *
 * @param refreshInterval - How often to check and refresh (in ms), default 5 minutes
 */
export function useSessionRefresh(refreshInterval: number = 5 * 60 * 1000) {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      // Refresh the session
      try {
        await update();
      } catch (error) {
        console.error('[Session] Failed to refresh session:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [session, refreshInterval, update]);
}

/**
 * Hook to monitor session expiration and warn user
 * Shows warning before session expires
 *
 * @param warningTime - Time before expiry to show warning (in ms), default 5 minutes
 * @param onWarning - Callback when warning should be shown
 * @param onExpired - Callback when session has expired
 */
export function useSessionExpiryWarning(
  warningTime: number = 5 * 60 * 1000,
  onWarning?: () => void,
  onExpired?: () => void
) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.expires) return;

    const checkExpiry = () => {
      const expiryTime = new Date(session.expires).getTime();
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      if (timeUntilExpiry <= 0) {
        // Session expired
        onExpired?.();
      } else if (timeUntilExpiry <= warningTime) {
        // Show warning
        onWarning?.();
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [session, status, warningTime, onWarning, onExpired]);
}
