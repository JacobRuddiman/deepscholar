'use client';

import { useRef, useEffect, RefObject } from 'react';

/**
 * Configuration for swipe gestures
 */
interface SwipeConfig {
  /**
   * Minimum distance in pixels to register a swipe
   */
  minDistance?: number;
  /**
   * Maximum duration in milliseconds
   */
  maxDuration?: number;
  /**
   * Callback when swipe left detected
   */
  onSwipeLeft?: () => void;
  /**
   * Callback when swipe right detected
   */
  onSwipeRight?: () => void;
  /**
   * Callback when swipe up detected
   */
  onSwipeUp?: () => void;
  /**
   * Callback when swipe down detected
   */
  onSwipeDown?: () => void;
}

/**
 * Hook to detect swipe gestures
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>(
  config: SwipeConfig = {}
): RefObject<T> {
  const {
    minDistance = 50,
    maxDuration = 300,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const elementRef = useRef<T>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;

      // Check if swipe meets criteria
      if (duration > maxDuration) {
        touchStartRef.current = null;
        return;
      }

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe (more horizontal than vertical)
      if (absX > absY && absX > minDistance) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
      // Vertical swipe (more vertical than horizontal)
      else if (absY > absX && absY > minDistance) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [minDistance, maxDuration, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return elementRef;
}

/**
 * Configuration for long press gesture
 */
interface LongPressConfig {
  /**
   * Duration in milliseconds to trigger long press
   */
  duration?: number;
  /**
   * Callback when long press is triggered
   */
  onLongPress: () => void;
  /**
   * Optional callback when press starts
   */
  onPressStart?: () => void;
  /**
   * Optional callback when press ends
   */
  onPressEnd?: () => void;
}

/**
 * Hook to detect long press gesture
 */
export function useLongPress<T extends HTMLElement = HTMLButtonElement>(
  config: LongPressConfig
): RefObject<T> {
  const { duration = 500, onLongPress, onPressStart, onPressEnd } = config;

  const elementRef = useRef<T>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const startPress = () => {
      isLongPressRef.current = false;
      onPressStart?.();

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, duration);
    };

    const endPress = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onPressEnd?.();
    };

    const cancelPress = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // Mouse events
    element.addEventListener('mousedown', startPress);
    element.addEventListener('mouseup', endPress);
    element.addEventListener('mouseleave', cancelPress);

    // Touch events
    element.addEventListener('touchstart', startPress, { passive: true });
    element.addEventListener('touchend', endPress, { passive: true });
    element.addEventListener('touchcancel', cancelPress, { passive: true });

    return () => {
      element.removeEventListener('mousedown', startPress);
      element.removeEventListener('mouseup', endPress);
      element.removeEventListener('mouseleave', cancelPress);
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', endPress);
      element.removeEventListener('touchcancel', cancelPress);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, onLongPress, onPressStart, onPressEnd]);

  return elementRef;
}

/**
 * Configuration for pinch zoom gesture
 */
interface PinchConfig {
  /**
   * Callback when pinch zoom is detected
   * @param scale - Scale factor (>1 for zoom in, <1 for zoom out)
   */
  onPinch?: (scale: number) => void;
  /**
   * Callback when pinch starts
   */
  onPinchStart?: () => void;
  /**
   * Callback when pinch ends
   */
  onPinchEnd?: () => void;
}

/**
 * Hook to detect pinch zoom gesture
 */
export function usePinch<T extends HTMLElement = HTMLDivElement>(
  config: PinchConfig = {}
): RefObject<T> {
  const { onPinch, onPinchStart, onPinchEnd } = config;

  const elementRef = useRef<T>(null);
  const initialDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return null;

      const [touch1, touch2] = Array.from(touches);
      const deltaX = touch2.clientX - touch1.clientX;
      const deltaY = touch2.clientY - touch1.clientY;

      return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = getDistance(e.touches);
        if (distance) {
          initialDistanceRef.current = distance;
          onPinchStart?.();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current) {
        e.preventDefault(); // Prevent default zoom

        const distance = getDistance(e.touches);
        if (distance) {
          const scale = distance / initialDistanceRef.current;
          onPinch?.(scale);
        }
      }
    };

    const handleTouchEnd = () => {
      if (initialDistanceRef.current) {
        initialDistanceRef.current = null;
        onPinchEnd?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinch, onPinchStart, onPinchEnd]);

  return elementRef;
}

/**
 * Hook to detect double tap gesture
 */
export function useDoubleTap<T extends HTMLElement = HTMLDivElement>(
  onDoubleTap: () => void,
  delay: number = 300
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
        e.preventDefault();
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onDoubleTap, delay]);

  return elementRef;
}

/**
 * Hook to prevent pull-to-refresh on mobile
 */
export function usePreventPullToRefresh<T extends HTMLElement = HTMLDivElement>(): RefObject<T> {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;

      // Prevent pull-to-refresh if scrolling down at top of page
      if (y > startY && element.scrollTop === 0) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return elementRef;
}
