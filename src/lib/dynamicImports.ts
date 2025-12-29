/**
 * Dynamic imports for code splitting
 * Use these utilities to lazy-load heavy components
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Loading component shown during lazy load
 */
export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Minimal loading component for small components
 */
export function MinimalLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-4">
      <svg
        className="w-4 h-4 animate-spin text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * Create a lazy-loaded component with loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading || LoadingFallback,
    ssr: options?.ssr ?? true,
  });
}

/**
 * Create a lazy-loaded component without SSR
 * Useful for components that use browser-only APIs
 */
export function lazyLoadClient<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading || LoadingFallback,
    ssr: false,
  });
}

/**
 * Pre-configured lazy-loaded components for common use cases
 */

// Heavy editor components
export const LazyMarkdownEditor = lazyLoad(
  () => import('@/components/editors/MarkdownEditor'),
  { loading: LoadingFallback }
);

// Charts and visualizations (usually client-only)
export const LazyChart = lazyLoadClient(
  () => import('@/components/charts/Chart'),
  { loading: MinimalLoadingFallback }
);

// Modal/Dialog components (loaded on demand)
export const LazyModal = lazyLoad(
  () => import('@/components/dialogs/Modal'),
  { loading: MinimalLoadingFallback }
);

// Image galleries (heavy with media)
export const LazyImageGallery = lazyLoad(
  () => import('@/components/media/ImageGallery'),
  { loading: LoadingFallback }
);

// Code syntax highlighter (large bundle)
export const LazyCodeBlock = lazyLoad(
  () => import('@/components/code/CodeBlock'),
  { loading: MinimalLoadingFallback }
);

// PDF viewer (very heavy)
export const LazyPDFViewer = lazyLoadClient(
  () => import('@/components/viewers/PDFViewer'),
  { loading: LoadingFallback }
);

// Rich text editor (very heavy)
export const LazyRichTextEditor = lazyLoadClient(
  () => import('@/components/editors/RichTextEditor'),
  { loading: LoadingFallback }
);

// Calendar/date picker (heavy with date logic)
export const LazyDatePicker = lazyLoad(
  () => import('@/components/forms/DatePicker'),
  { loading: MinimalLoadingFallback }
);

// Analytics dashboard (client-only with charts)
export const LazyAnalyticsDashboard = lazyLoadClient(
  () => import('@/components/analytics/Dashboard'),
  { loading: LoadingFallback }
);

// Comments section (heavy with nested components)
export const LazyCommentsSection = lazyLoad(
  () => import('@/components/social/CommentsSection'),
  { loading: LoadingFallback }
);
