'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /**
   * Optional custom breadcrumb items
   * If not provided, will auto-generate from URL path
   */
  items?: BreadcrumbItem[];
  /**
   * Optional custom home label
   */
  homeLabel?: string;
}

/**
 * Breadcrumb navigation component
 * Automatically generates breadcrumbs from the current path
 * or uses custom breadcrumb items
 */
export function Breadcrumbs({ items, homeLabel = 'Home' }: BreadcrumbsProps = {}) {
  const pathname = usePathname();

  // Generate breadcrumbs from path if not provided
  const breadcrumbs: BreadcrumbItem[] = items || generateBreadcrumbs(pathname);

  // Add home breadcrumb at the start
  const allBreadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: '/' },
    ...breadcrumbs,
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        {allBreadcrumbs.map((crumb, index) => {
          const isLast = index === allBreadcrumbs.length - 1;

          return (
            <Fragment key={crumb.href}>
              {index > 0 && (
                <li aria-hidden="true" className="select-none">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </li>
              )}

              <li>
                {isLast ? (
                  <span
                    className="font-medium text-gray-900 dark:text-gray-100"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, '').split('/');

  // Filter out empty segments
  const validSegments = segments.filter(Boolean);

  if (validSegments.length === 0) return [];

  // Generate breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  for (const segment of validSegments) {
    currentPath += `/${segment}`;

    // Format label: replace hyphens/underscores with spaces, capitalize
    const label = formatBreadcrumbLabel(segment);

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

/**
 * Format breadcrumb label
 * Converts URL segments to readable labels
 */
function formatBreadcrumbLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    api: 'API',
    ai: 'AI',
    faq: 'FAQ',
    pdf: 'PDF',
    'oauth': 'OAuth',
  };

  const lower = segment.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  // Replace hyphens and underscores with spaces
  let formatted = segment.replace(/[-_]/g, ' ');

  // Capitalize first letter of each word
  formatted = formatted
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}

/**
 * Hook for using breadcrumbs with custom labels
 */
export function useBreadcrumbs(customItems: BreadcrumbItem[]) {
  return customItems;
}
