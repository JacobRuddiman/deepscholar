'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * Skip links component for accessibility
 * Allows keyboard users to quickly jump to main content areas
 */
export function SkipLinks() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleFocus = () => setIsVisible(true);
    const handleBlur = () => setIsVisible(false);

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const skipTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.setAttribute('tabindex', '-1');
      element.focus();
      element.removeAttribute('tabindex');
    }
  };

  return (
    <div
      className="fixed top-0 left-0 z-50"
      aria-label="Skip navigation links"
    >
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          skipTo('main-content');
        }}
        className="absolute left-0 top-0 -translate-y-full bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-br-md focus:translate-y-0 transition-transform"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        onClick={(e) => {
          e.preventDefault();
          skipTo('navigation');
        }}
        className="absolute left-0 top-0 -translate-y-full bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-br-md focus:translate-y-0 transition-transform ml-40"
      >
        Skip to navigation
      </a>
      <a
        href="#footer"
        onClick={(e) => {
          e.preventDefault();
          skipTo('footer');
        }}
        className="absolute left-0 top-0 -translate-y-full bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-br-md focus:translate-y-0 transition-transform ml-80"
      >
        Skip to footer
      </a>
    </div>
  );
}
