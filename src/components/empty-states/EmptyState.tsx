import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyStateProps {
  /**
   * Icon to display (can be emoji or SVG component)
   */
  icon?: ReactNode;
  /**
   * Main heading text
   */
  title: string;
  /**
   * Descriptive text
   */
  description: string;
  /**
   * Optional call-to-action button
   */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /**
   * Optional secondary action
   */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Reusable empty state component
 * Shows a friendly message when there's no content to display
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-6xl" aria-hidden="true">
          {icon}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {action.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-md font-medium transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-md font-medium transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStates = {
  NoBriefs: () => (
    <EmptyState
      icon="📚"
      title="No briefs found"
      description="There are no briefs matching your criteria. Try adjusting your filters or create a new brief."
      action={{
        label: "Create Brief",
        href: "/create",
      }}
      secondaryAction={{
        label: "Clear Filters",
        onClick: () => window.location.reload(),
      }}
    />
  ),

  NoSavedBriefs: () => (
    <EmptyState
      icon="🔖"
      title="No saved briefs yet"
      description="You haven't saved any briefs yet. Browse the library and save briefs for later reading."
      action={{
        label: "Browse Briefs",
        href: "/briefs",
      }}
    />
  ),

  NoReviews: () => (
    <EmptyState
      icon="⭐"
      title="No reviews yet"
      description="This brief hasn't been reviewed yet. Be the first to share your thoughts!"
      action={{
        label: "Write a Review",
        onClick: () => {
          const reviewSection = document.getElementById('write-review');
          reviewSection?.scrollIntoView({ behavior: 'smooth' });
        },
      }}
    />
  ),

  NoSearchResults: (query: string) => (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find any briefs matching "${query}". Try different keywords or browse all briefs.`}
      action={{
        label: "Browse All Briefs",
        href: "/briefs",
      }}
      secondaryAction={{
        label: "Clear Search",
        onClick: () => window.location.reload(),
      }}
    />
  ),

  NoNotifications: () => (
    <EmptyState
      icon="🔔"
      title="No notifications"
      description="You're all caught up! We'll notify you when there's something new."
    />
  ),

  NoUserBriefs: () => (
    <EmptyState
      icon="✍️"
      title="No briefs created yet"
      description="This user hasn't created any briefs yet. Check back later!"
    />
  ),

  Unauthorized: () => (
    <EmptyState
      icon="🔒"
      title="Sign in required"
      description="You need to be signed in to access this content."
      action={{
        label: "Sign In",
        href: "/auth/signin",
      }}
    />
  ),

  Error: (message?: string) => (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={message || "We encountered an error while loading this content. Please try again."}
      action={{
        label: "Retry",
        onClick: () => window.location.reload(),
      }}
    />
  ),
};
