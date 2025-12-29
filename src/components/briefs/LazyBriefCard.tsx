'use client';

import { useLazyLoad } from '@/hooks/useIntersectionObserver';
import { BriefCardSkeleton } from '@/components/skeletons/BriefCardSkeleton';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamically import BriefCard with no SSR
const BriefCard = dynamic(() => import('./BriefCard'), {
  ssr: false,
  loading: () => <BriefCardSkeleton />,
});

interface LazyBriefCardProps {
  briefId: string;
  [key: string]: any;
}

/**
 * Lazy-loaded brief card component
 * Only loads content when scrolled into view
 */
export function LazyBriefCard({ briefId, ...props }: LazyBriefCardProps) {
  const [ref, isVisible] = useLazyLoad<HTMLDivElement>('100px');

  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible ? (
        <BriefCard briefId={briefId} {...props} />
      ) : (
        <BriefCardSkeleton />
      )}
    </div>
  );
}

/**
 * Lazy-loaded list of brief cards with staggered loading
 */
interface LazyBriefListProps {
  briefs: Array<{ id: string; [key: string]: any }>;
  BriefCardComponent?: ComponentType<any>;
  className?: string;
}

export function LazyBriefList({
  briefs,
  BriefCardComponent = BriefCard,
  className = '',
}: LazyBriefListProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {briefs.map((brief, index) => (
        <LazyBriefCardWrapper
          key={brief.id}
          brief={brief}
          index={index}
          BriefCardComponent={BriefCardComponent}
        />
      ))}
    </div>
  );
}

/**
 * Individual wrapper for each brief card with lazy loading
 */
function LazyBriefCardWrapper({
  brief,
  index,
  BriefCardComponent,
}: {
  brief: any;
  index: number;
  BriefCardComponent: ComponentType<any>;
}) {
  const [ref, isVisible] = useLazyLoad<HTMLDivElement>('150px');

  return (
    <div
      ref={ref}
      className="min-h-[200px]"
      style={{
        // Stagger animation delay based on index
        animationDelay: `${index * 50}ms`,
      }}
    >
      {isVisible ? (
        <div className="animate-fade-in">
          <BriefCardComponent {...brief} />
        </div>
      ) : (
        <BriefCardSkeleton />
      )}
    </div>
  );
}

/**
 * Infinite scroll container for brief lists
 */
interface InfiniteScrollBriefListProps {
  briefs: Array<{ id: string; [key: string]: any }>;
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  loading?: boolean;
  BriefCardComponent?: ComponentType<any>;
  className?: string;
}

export function InfiniteScrollBriefList({
  briefs,
  onLoadMore,
  hasMore,
  loading = false,
  BriefCardComponent = BriefCard,
  className = '',
}: InfiniteScrollBriefListProps) {
  const [sentinelRef, isVisible] = useLazyLoad<HTMLDivElement>('300px');

  // Trigger load more when sentinel becomes visible
  if (isVisible && hasMore && !loading) {
    onLoadMore();
  }

  return (
    <div className={className}>
      <LazyBriefList briefs={briefs} BriefCardComponent={BriefCardComponent} />

      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="py-8">
          {loading && (
            <div className="space-y-6">
              <BriefCardSkeleton />
              <BriefCardSkeleton />
              <BriefCardSkeleton />
            </div>
          )}
        </div>
      )}

      {!hasMore && briefs.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No more briefs to load
        </div>
      )}
    </div>
  );
}
