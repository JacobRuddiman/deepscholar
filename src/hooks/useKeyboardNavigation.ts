import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardNavigationOptions {
  /**
   * CSS selector for focusable elements
   */
  selector?: string;
  /**
   * Callback when navigating forward (Tab or Arrow Down)
   */
  onNavigateForward?: () => void;
  /**
   * Callback when navigating backward (Shift+Tab or Arrow Up)
   */
  onNavigateBackward?: () => void;
  /**
   * Callback when Enter or Space is pressed
   */
  onActivate?: (element: Element) => void;
  /**
   * Enable/disable the keyboard navigation
   */
  enabled?: boolean;
  /**
   * Container ref to scope keyboard navigation
   */
  containerRef?: RefObject<HTMLElement>;
}

/**
 * Hook for adding keyboard navigation to components
 * Supports Tab, Arrow keys, Enter, and Escape
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    onNavigateForward,
    onNavigateBackward,
    onActivate,
    enabled = true,
    containerRef,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const container = containerRef?.current || document;
      const focusableElements = Array.from(
        container.querySelectorAll(selector)
      ).filter((el) => {
        const element = el as HTMLElement;
        return (
          !element.hasAttribute('disabled') &&
          element.offsetParent !== null && // Element is visible
          window.getComputedStyle(element).display !== 'none'
        );
      });

      const currentIndex = focusableElements.indexOf(
        document.activeElement as Element
      );

      switch (event.key) {
        case 'Tab':
          // Let default Tab behavior work, but call callbacks
          if (event.shiftKey) {
            onNavigateBackward?.();
          } else {
            onNavigateForward?.();
          }
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
            (focusableElements[currentIndex + 1] as HTMLElement).focus();
          } else if (focusableElements.length > 0) {
            // Wrap to first element
            (focusableElements[0] as HTMLElement).focus();
          }
          onNavigateForward?.();
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          if (currentIndex > 0) {
            (focusableElements[currentIndex - 1] as HTMLElement).focus();
          } else if (focusableElements.length > 0) {
            // Wrap to last element
            (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
          }
          onNavigateBackward?.();
          break;

        case 'Enter':
        case ' ':
          // Only handle if not already on a button or link
          if (
            document.activeElement &&
            !['BUTTON', 'A'].includes(document.activeElement.tagName)
          ) {
            event.preventDefault();
            onActivate?.(document.activeElement);
          }
          break;

        case 'Home':
          event.preventDefault();
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          }
          break;

        case 'End':
          event.preventDefault();
          if (focusableElements.length > 0) {
            (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
          }
          break;

        case 'Escape':
          // Blur current element to exit focus mode
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          break;
      }
    },
    [
      enabled,
      selector,
      onNavigateForward,
      onNavigateBackward,
      onActivate,
      containerRef,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef?.current || document;
    container.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, containerRef]);

  return {
    /**
     * Programmatically focus the first focusable element
     */
    focusFirst: () => {
      const container = containerRef?.current || document;
      const firstElement = container.querySelector(selector) as HTMLElement;
      firstElement?.focus();
    },
    /**
     * Programmatically focus the last focusable element
     */
    focusLast: () => {
      const container = containerRef?.current || document;
      const elements = container.querySelectorAll(selector);
      (elements[elements.length - 1] as HTMLElement)?.focus();
    },
  };
}

/**
 * Hook for trapping focus within a modal or dialog
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean = true) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll(focusableSelector)
      ).filter((el) => {
        const element = el as HTMLElement;
        return !element.hasAttribute('disabled') && element.offsetParent !== null;
      }) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element when trap activates
    const focusableElements = container.querySelectorAll(focusableSelector);
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, active]);
}
