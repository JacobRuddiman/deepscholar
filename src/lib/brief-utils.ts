/**
 * Shared utilities for brief data transformation
 */

import type { BriefCardProps } from '@/app/components/brief_card';

/**
 * Brief type from database with all relations
 */
export interface DatabaseBrief {
  id: string;
  title: string;
  abstract: string | null;
  createdAt: Date;
  response: string;
  slug: string | null;
  viewCount: number | null;
  model: {
    name: string;
  };
  categories: Array<{
    name: string;
  }>;
  reviews: Array<{
    rating: number;
  }>;
}

/**
 * Calculate average rating from reviews
 * @param reviews - Array of reviews with ratings
 * @returns Average rating or undefined if no reviews
 */
export function calculateAverageRating(reviews: Array<{ rating: number }>): number | undefined {
  if (!reviews || reviews.length === 0) return undefined;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

/**
 * Calculate estimated read time from content length
 * @param content - The content to calculate read time for
 * @param wordsPerMinute - Reading speed (default: 200 wpm)
 * @returns Estimated read time in minutes
 */
export function calculateReadTime(content: string | null, wordsPerMinute = 200): number {
  if (!content) return 1;
  // Rough estimation: 5 characters per word on average
  const estimatedWords = content.length / 5;
  return Math.max(1, Math.ceil(estimatedWords / wordsPerMinute));
}

/**
 * Transform a database brief to BriefCardProps
 * @param brief - The brief from the database
 * @returns Transformed brief card props
 */
export function transformBrief(brief: DatabaseBrief): BriefCardProps {
  const reviewCount = brief.reviews?.length ?? 0;
  const averageRating = calculateAverageRating(brief.reviews);

  return {
    id: brief.id,
    title: brief.title,
    abstract: brief.abstract ?? '',
    model: brief.model?.name ?? 'Unknown',
    date: brief.createdAt.toISOString().split('T')[0]!,
    readTime: `${calculateReadTime(brief.response)} min`,
    category: brief.categories?.[0]?.name ?? 'General',
    views: brief.viewCount ?? 0,
    rating: averageRating,
    reviewCount,
    featured: (brief.viewCount ?? 0) > 100,
    _slug: brief.slug ?? undefined,
  };
}

/**
 * Format a date for display
 * @param date - The date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatBriefDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0]!;
}
