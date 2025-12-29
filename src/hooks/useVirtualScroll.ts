'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualScrollOptions {
  /**
   * Height of each item in pixels
   */
  itemHeight: number;
  /**
   * Number of items to render above and below viewport (buffer)
   */
  overscan?: number;
  /**
   * Container height (if not using full viewport)
   */
  containerHeight?: number;
  /**
   * Enable smooth scrolling
   */
  smoothScroll?: boolean;
}

interface VirtualScrollResult<T> {
  /**
   * Ref to attach to scroll container
   */
  containerRef: React.RefObject<HTMLDivElement>;
  /**
   * Visible items to render
   */
  visibleItems: T[];
  /**
   * Indices of visible items
   */
  visibleRange: { start: number; end: number };
  /**
   * Total height of all items (for scrollbar)
   */
  totalHeight: number;
  /**
   * Offset from top (for absolute positioning)
   */
  offsetY: number;
  /**
   * Scroll to specific index
   */
  scrollToIndex: (index: number) => void;
}

/**
 * Hook for virtual scrolling (windowing) of large lists
 * Only renders items visible in viewport + buffer
 */
export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    overscan = 3,
    containerHeight,
    smoothScroll = true,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    containerHeight || (typeof window !== 'undefined' ? window.innerHeight : 800)
  );

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(
      items.length,
      start + visibleCount + overscan * 2
    );

    return { start, end };
  }, [scrollTop, itemHeight, viewportHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  // Offset for absolute positioning
  const offsetY = visibleRange.start * itemHeight;

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Update viewport height on resize
  useEffect(() => {
    if (containerHeight) return;

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerHeight]);

  // Scroll to index function
  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const targetScrollTop = index * itemHeight;

    if (smoothScroll) {
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = targetScrollTop;
    }
  };

  return {
    containerRef,
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    scrollToIndex,
  };
}

/**
 * Virtual scroll component for lists
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  itemClassName = '',
  emptyMessage = 'No items to display',
}: VirtualListProps<T>) {
  const {
    containerRef,
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
  } = useVirtualScroll(items, { itemHeight, overscan });

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%', position: 'relative' }}
    >
      {/* Spacer to maintain scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const absoluteIndex = visibleRange.start + index;
            return (
              <div
                key={absoluteIndex}
                className={itemClassName}
                style={{
                  height: itemHeight,
                  overflow: 'hidden',
                }}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Grid virtual scroll (for masonry/grid layouts)
 */
interface UseVirtualGridOptions {
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  overscan?: number;
}

export function useVirtualGrid<T>(
  items: T[],
  options: UseVirtualGridOptions
) {
  const { itemWidth, itemHeight, gap = 16, overscan = 1 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate columns
  const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  const rows = Math.ceil(items.length / columns);

  // Calculate visible range
  const rowHeight = itemHeight + gap;
  const totalHeight = rows * rowHeight;
  const viewportHeight = containerRef.current?.clientHeight || 800;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleRows = Math.ceil(viewportHeight / rowHeight);
  const endRow = Math.min(rows, startRow + visibleRows + overscan * 2);

  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);

  const visibleItems = items.slice(startIndex, endIndex);

  // Handle scroll and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const handleResize = () => setContainerWidth(container.clientWidth);

    handleResize(); // Initial width
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    containerRef,
    visibleItems,
    visibleRange: { start: startIndex, end: endIndex },
    totalHeight,
    offsetY: startRow * rowHeight,
    columns,
    itemWidth,
    itemHeight,
    gap,
  };
}
