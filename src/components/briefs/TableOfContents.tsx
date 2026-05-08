'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';

interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  /** HTML content to extract headings from */
  htmlContent: string;
  /** Selector for the content container (used for scroll-to) */
  contentSelector?: string;
  /** Whether to start collapsed on mobile */
  defaultCollapsed?: boolean;
}

/**
 * Table of Contents component for structured brief content.
 * Parses HTML headings (h1-h4) and displays a clickable navigation outline.
 */
export default function TableOfContents({
  htmlContent,
  contentSelector = '.prose',
  defaultCollapsed = true,
}: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeId, setActiveId] = useState<string>('');

  // Parse headings from HTML content
  const headings = useMemo((): TocHeading[] => {
    if (!htmlContent) return [];

    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    if (!parser) return [];

    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.querySelectorAll('h1, h2, h3, h4');
    const result: TocHeading[] = [];

    elements.forEach((el, index) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;

      const id = `toc-heading-${index}`;
      const level = parseInt(el.tagName.charAt(1), 10);
      result.push({ id, text, level });
    });

    return result;
  }, [htmlContent]);

  // Add IDs to actual DOM headings on mount
  useEffect(() => {
    if (headings.length === 0) return;

    const container = document.querySelector(contentSelector);
    if (!container) return;

    const elements = container.querySelectorAll('h1, h2, h3, h4');
    elements.forEach((el, index) => {
      const heading = headings[index];
      if (heading) {
        el.id = heading.id;
      }
    });
  }, [headings, contentSelector]);

  // Track active heading with IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) {
    // Don't show TOC for content with fewer than 3 headings
    return null;
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 no-print">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
        aria-expanded={!isCollapsed}
        aria-controls="toc-list"
      >
        <span className="flex items-center gap-2">
          <List className="w-4 h-4" />
          Table of Contents
          <span className="text-xs text-gray-500">({headings.length})</span>
        </span>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>

      {!isCollapsed && (
        <nav id="toc-list" aria-label="Table of contents" className="px-4 pb-3">
          <ol className="space-y-1 list-none">
            {headings.map((heading) => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - minLevel) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`text-left text-sm w-full px-2 py-1 rounded transition-colors truncate ${
                    activeId === heading.id
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/30'
                  }`}
                  title={heading.text}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
