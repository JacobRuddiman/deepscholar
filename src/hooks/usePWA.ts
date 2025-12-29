'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to register and manage service worker
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service worker registered');
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Update available');
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000); // Every hour
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = () => {
    if (!registration || !registration.waiting) return;

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload after activation
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  };

  const cacheUrls = (urls: string[]) => {
    if (!registration || !registration.active) return;

    registration.active.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  };

  const clearCache = () => {
    if (!registration || !registration.active) return;

    registration.active.postMessage({
      type: 'CLEAR_CACHE',
    });
  };

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
    isOnline,
    cacheUrls,
    clearCache,
  };
}

/**
 * Hook to detect if app is installed as PWA
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect when app is installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }

    return false;
  };

  return {
    canInstall: !!installPrompt,
    isInstalled,
    promptInstall,
  };
}

/**
 * Hook to manage push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    setPermission(Notification.permission);

    // Check for existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
      });
    });
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const subscribe = async () => {
    const registration = await navigator.serviceWorker.ready;

    // Generate VAPID keys on your server
    // This is a placeholder - replace with your actual public key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    setSubscription(sub);

    // Send subscription to server
    // await fetch('/api/notifications/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify(sub),
    //   headers: { 'Content-Type': 'application/json' },
    // });

    return sub;
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    await subscription.unsubscribe();
    setSubscription(null);

    // Notify server
    // await fetch('/api/notifications/unsubscribe', {
    //   method: 'POST',
    //   body: JSON.stringify({ endpoint: subscription.endpoint }),
    // });
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
  };
}

/**
 * Hook to detect network quality
 */
export function useNetworkQuality() {
  const [quality, setQuality] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!connection) return;

    const updateNetworkInfo = () => {
      setSaveData(connection.saveData || false);

      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setQuality('slow');
      } else if (effectiveType === '3g') {
        setQuality('normal');
      } else {
        setQuality('fast');
      }
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return { quality, saveData };
}

/**
 * Utility function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook to manage app badges (unread count)
 */
export function useAppBadge() {
  const setAppBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count);
    }
  };

  const clearAppBadge = () => {
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    }
  };

  return { setAppBadge, clearAppBadge };
}
