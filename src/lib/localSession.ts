'use client';

import { LOCAL_AUTH, LOCAL_SESSION, LOCAL_USER } from './localMode';

/**
 * Local session persistence for local development mode
 * Stores session in localStorage to persist across page reloads
 */

const LOCAL_SESSION_KEY = 'deepscholar_local_session';
const LOCAL_SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface LocalSessionData {
  user: typeof LOCAL_USER;
  expires: string;
  createdAt: string;
}

/**
 * Save local session to localStorage
 */
export function saveLocalSession(sessionData?: LocalSessionData) {
  if (!LOCAL_AUTH) return;

  const data: LocalSessionData = sessionData || {
    user: LOCAL_USER,
    expires: new Date(Date.now() + LOCAL_SESSION_EXPIRY).toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[LocalSession] Failed to save session:', error);
  }
}

/**
 * Load local session from localStorage
 */
export function loadLocalSession(): LocalSessionData | null {
  if (!LOCAL_AUTH) return null;

  try {
    const stored = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!stored) return null;

    const data: LocalSessionData = JSON.parse(stored);

    // Check if session has expired
    const expiresAt = new Date(data.expires);
    if (expiresAt < new Date()) {
      clearLocalSession();
      return null;
    }

    return data;
  } catch (error) {
    console.error('[LocalSession] Failed to load session:', error);
    return null;
  }
}

/**
 * Clear local session from localStorage
 */
export function clearLocalSession() {
  if (!LOCAL_AUTH) return;

  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch (error) {
    console.error('[LocalSession] Failed to clear session:', error);
  }
}

/**
 * Get or create local session
 */
export function getOrCreateLocalSession(): LocalSessionData {
  if (!LOCAL_AUTH) {
    throw new Error('Local auth is not enabled');
  }

  const existing = loadLocalSession();
  if (existing) {
    return existing;
  }

  const newSession: LocalSessionData = {
    user: LOCAL_USER,
    expires: new Date(Date.now() + LOCAL_SESSION_EXPIRY).toISOString(),
    createdAt: new Date().toISOString(),
  };

  saveLocalSession(newSession);
  return newSession;
}

/**
 * Refresh local session expiry
 */
export function refreshLocalSession() {
  if (!LOCAL_AUTH) return;

  const session = loadLocalSession();
  if (!session) return;

  const refreshed: LocalSessionData = {
    ...session,
    expires: new Date(Date.now() + LOCAL_SESSION_EXPIRY).toISOString(),
  };

  saveLocalSession(refreshed);
}

/**
 * Check if local session is valid
 */
export function isLocalSessionValid(): boolean {
  if (!LOCAL_AUTH) return false;

  const session = loadLocalSession();
  if (!session) return false;

  const expiresAt = new Date(session.expires);
  return expiresAt > new Date();
}

/**
 * Hook to initialize local session on mount
 */
export function useLocalSession() {
  if (typeof window === 'undefined') return null;
  if (!LOCAL_AUTH) return null;

  // Initialize session if needed
  const session = getOrCreateLocalSession();

  // Set up automatic refresh every 5 minutes
  const refreshInterval = setInterval(() => {
    refreshLocalSession();
  }, 5 * 60 * 1000);

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(refreshInterval);
    });
  }

  return session;
}

/**
 * Store user preferences in local mode
 */
const PREFERENCES_KEY = 'deepscholar_local_preferences';

export interface LocalPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  [key: string]: any;
}

export function saveLocalPreferences(preferences: LocalPreferences) {
  if (!LOCAL_AUTH) return;

  try {
    const existing = loadLocalPreferences();
    const updated = { ...existing, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[LocalSession] Failed to save preferences:', error);
  }
}

export function loadLocalPreferences(): LocalPreferences {
  if (!LOCAL_AUTH) return {};

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[LocalSession] Failed to load preferences:', error);
    return {};
  }
}

/**
 * Track user activity in local mode
 */
const ACTIVITY_KEY = 'deepscholar_local_activity';

export interface LocalActivity {
  viewedBriefs: string[];
  savedBriefs: string[];
  upvotedBriefs: string[];
  recentSearches: string[];
  lastActive: string;
}

export function saveLocalActivity(activity: Partial<LocalActivity>) {
  if (!LOCAL_AUTH) return;

  try {
    const existing = loadLocalActivity();
    const updated: LocalActivity = {
      ...existing,
      ...activity,
      lastActive: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[LocalSession] Failed to save activity:', error);
  }
}

export function loadLocalActivity(): LocalActivity {
  if (!LOCAL_AUTH) {
    return {
      viewedBriefs: [],
      savedBriefs: [],
      upvotedBriefs: [],
      recentSearches: [],
      lastActive: new Date().toISOString(),
    };
  }

  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          viewedBriefs: [],
          savedBriefs: [],
          upvotedBriefs: [],
          recentSearches: [],
          lastActive: new Date().toISOString(),
        };
  } catch (error) {
    console.error('[LocalSession] Failed to load activity:', error);
    return {
      viewedBriefs: [],
      savedBriefs: [],
      upvotedBriefs: [],
      recentSearches: [],
      lastActive: new Date().toISOString(),
    };
  }
}

/**
 * Clear all local mode data
 */
export function clearAllLocalData() {
  if (!LOCAL_AUTH) return;

  try {
    clearLocalSession();
    localStorage.removeItem(PREFERENCES_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  } catch (error) {
    console.error('[LocalSession] Failed to clear all data:', error);
  }
}
