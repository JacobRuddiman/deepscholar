'use client';

import { useEffect, useRef } from 'react';

/**
 * Client-side behavior tracking for bot detection
 * Add to root layout or individual pages
 */
export function BotDetectionTracker() {
  const mouseEvents = useRef(0);
  const keyboardEvents = useRef(0);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    // Track mouse movements
    const handleMouseMove = () => {
      mouseEvents.current += 1;
    };

    // Track keyboard events
    const handleKeyPress = () => {
      keyboardEvents.current += 1;
    };

    // Track clicks
    const handleClick = () => {
      mouseEvents.current += 1;
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('click', handleClick);

    // Store behavior data in sessionStorage
    const storeInterval = setInterval(() => {
      const sessionDuration = (Date.now() - sessionStart.current) / 1000;

      sessionStorage.setItem(
        'botDetection',
        JSON.stringify({
          mouseEvents: mouseEvents.current,
          keyboardEvents: keyboardEvents.current,
          sessionDuration,
        })
      );
    }, 5000); // Update every 5 seconds

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('click', handleClick);
      clearInterval(storeInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Get stored bot detection data
 */
export function getBotDetectionData(): {
  mouseEvents: number;
  keyboardEvents: number;
  sessionDuration: number;
} {
  if (typeof window === 'undefined') {
    return { mouseEvents: 0, keyboardEvents: 0, sessionDuration: 0 };
  }

  const stored = sessionStorage.getItem('botDetection');

  if (!stored) {
    return { mouseEvents: 0, keyboardEvents: 0, sessionDuration: 0 };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { mouseEvents: 0, keyboardEvents: 0, sessionDuration: 0 };
  }
}

/**
 * Honeypot input component (hidden field that bots fill)
 */
export function HoneypotInput({ name = 'website_url' }: { name?: string }) {
  return (
    <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
      <label htmlFor={name}>Leave this field empty</label>
      <input
        type="text"
        id={name}
        name={name}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
