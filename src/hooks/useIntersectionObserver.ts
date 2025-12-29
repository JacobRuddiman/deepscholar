'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection. If not specified, uses viewport.
   */
  root?: Element | null;
  /**
   * Margin around root. Can be similar to CSS margin property.
   * e.g., "10px 20px 30px 40px"
   */
  rootMargin?: string;
  /**
   * Threshold(s) at which to trigger callback. 0-1.
   * e.g., 0.5 means callback fires when 50% visible
   */
  threshold?: number | number[];
  /**
   * Fire callback only once
   */
  triggerOnce?: boolean;
  /**
   * Initial visibility state (for SSR)
   */
  initialIsIntersecting?: boolean;
}

/**
 * Hook for observing element visibility using Intersection Observer API
 * Useful for lazy loading, infinite scroll, analytics, etc.
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T>, boolean] {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0,
    triggerOnce = false,
    initialIsIntersecting = false,
  } = options;

  const elementRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is enabled
    if (triggerOnce && isIntersecting) return;

    // Create observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        // Unobserve if triggerOnce and now intersecting
        if (triggerOnce && isElementIntersecting && observerRef.current) {
          observerRef.current.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [root, rootMargin, threshold, triggerOnce, isIntersecting]);

  return [elementRef, isIntersecting];
}

/**
 * Simplified hook for lazy loading (trigger once when visible)
 */
export function useLazyLoad<T extends Element = HTMLDivElement>(
  rootMargin = '50px'
): [React.RefObject<T>, boolean] {
  return useIntersectionObserver<T>({
    rootMargin,
    threshold: 0,
    triggerOnce: true,
    initialIsIntersecting: false,
  });
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  onLoadMore: () => void | Promise<void>,
  options: {
    rootMargin?: string;
    threshold?: number;
    enabled?: boolean;
  } = {}
): React.RefObject<T> {
  const { rootMargin = '200px', threshold = 0, enabled = true } = options;
  const [ref, isIntersecting] = useIntersectionObserver<T>({
    rootMargin,
    threshold,
    triggerOnce: false,
  });

  const loadingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!isIntersecting) return;
    if (loadingRef.current) return;

    const load = async () => {
      loadingRef.current = true;
      try {
        await onLoadMore();
      } finally {
        loadingRef.current = false;
      }
    };

    load();
  }, [isIntersecting, onLoadMore, enabled]);

  return ref;
}
