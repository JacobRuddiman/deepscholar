'use client';

import { useEffect, createContext, useContext, ReactNode } from 'react';
import { LOCAL_AUTH } from '@/lib/localMode';
import {
  getOrCreateLocalSession,
  refreshLocalSession,
  LocalSessionData,
  saveLocalActivity,
} from '@/lib/localSession';

interface LocalSessionContextType {
  session: LocalSessionData | null;
  refreshSession: () => void;
}

const LocalSessionContext = createContext<LocalSessionContextType>({
  session: null,
  refreshSession: () => {},
});

export function useLocalSessionContext() {
  return useContext(LocalSessionContext);
}

export function LocalSessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!LOCAL_AUTH) return;

    // Initialize session on mount
    const session = getOrCreateLocalSession();

    // Set up automatic refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      refreshLocalSession();
    }, 5 * 60 * 1000);

    // Update last active timestamp on user interaction
    const updateActivity = () => {
      saveLocalActivity({ lastActive: new Date().toISOString() });
    };

    // Track activity on various events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true, once: true });
    });

    // Update activity on visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
        refreshLocalSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const contextValue: LocalSessionContextType = {
    session: LOCAL_AUTH ? getOrCreateLocalSession() : null,
    refreshSession: refreshLocalSession,
  };

  return (
    <LocalSessionContext.Provider value={contextValue}>
      {children}
    </LocalSessionContext.Provider>
  );
}
