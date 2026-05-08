'use client';

import { useState, useEffect } from 'react';

interface NavigatorWithMSTouch extends Navigator {
  msMaxTouchPoints?: number;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Breakpoints matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect current screen size and breakpoint
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < BREAKPOINTS.md;
  const isTablet = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isDesktop = windowSize.width >= BREAKPOINTS.lg;
  const isLargeDesktop = windowSize.width >= BREAKPOINTS.xl;

  const breakpoint: Breakpoint =
    windowSize.width >= BREAKPOINTS['2xl']
      ? '2xl'
      : windowSize.width >= BREAKPOINTS.xl
      ? 'xl'
      : windowSize.width >= BREAKPOINTS.lg
      ? 'lg'
      : windowSize.width >= BREAKPOINTS.md
      ? 'md'
      : 'sm';

  const isBreakpoint = (bp: Breakpoint, direction: 'up' | 'down' | 'only' = 'up') => {
    const currentWidth = windowSize.width;
    const bpWidth = BREAKPOINTS[bp];

    if (direction === 'up') {
      return currentWidth >= bpWidth;
    } else if (direction === 'down') {
      return currentWidth < bpWidth;
    } else {
      // 'only'
      const breakpointKeys = Object.keys(BREAKPOINTS) as Breakpoint[];
      const currentIndex = breakpointKeys.indexOf(bp);
      const nextBp = breakpointKeys[currentIndex + 1];

      if (!nextBp) {
        return currentWidth >= bpWidth;
      }

      return currentWidth >= bpWidth && currentWidth < BREAKPOINTS[nextBp];
    }
  };

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoint,
    isBreakpoint,
  };
}

/**
 * Hook to detect if user is on a touch device
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as NavigatorWithMSTouch).msMaxTouchPoints! > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook to detect if device is in standalone mode (PWA)
 */
export function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone === true
      );
    };

    checkStandalone();
  }, []);

  return isStandalone;
}

/**
 * Hook for media queries
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook to detect preferred color scheme
 */
export function usePreferredColorScheme() {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');
  return isDark ? 'dark' : 'light';
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
