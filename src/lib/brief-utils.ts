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

/**
 * Escape special HTML characters to prevent XSS when building HTML strings.
 */
function escapeHtmlChars(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Linkify URLs in text content
 * Converts plain text URLs to clickable hyperlinks
 * SECURITY: Non-URL text segments are HTML-escaped, and URL href attributes
 * are escaped to prevent XSS injection via crafted URLs or surrounding text.
 * @param text - The text content to linkify
 * @returns Text with URLs converted to hyperlinks
 */
export function linkifyText(text: string): string {
  if (!text) return text;

  // URL regex pattern - matches http, https, and www URLs
  const urlPattern = /(\b(https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]}])/gi;

  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    // Escape the text before this URL
    if (match.index > lastIndex) {
      parts.push(escapeHtmlChars(text.substring(lastIndex, match.index)));
    }

    const url = match[0];
    // Ensure the URL has a protocol
    const href = url.startsWith('http') ? url : `https://${url}`;
    parts.push(`<a href="${escapeHtmlChars(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${escapeHtmlChars(url)}</a>`);

    lastIndex = match.index + match[0].length;
  }

  // Escape the remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(escapeHtmlChars(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts.join('') : escapeHtmlChars(text);
}

/**
 * Linkify URLs in HTML content while preserving existing HTML structure
 * Only linkifies URLs that are not already within anchor tags.
 * SECURITY: Text nodes are HTML-escaped via linkifyText to prevent XSS.
 * Text inside anchor tags is also escaped to prevent injection.
 * @param html - The HTML content to linkify
 * @returns HTML with URLs converted to hyperlinks
 */
export function linkifyHtml(html: string): string {
  if (!html) return html;

  // This regex matches text nodes (not inside tags) and linkifies URLs
  // It avoids URLs that are already inside href attributes or anchor tags
  const parts: string[] = [];
  let lastIndex = 0;

  // Split by HTML tags
  const tagPattern = /<[^>]+>/g;
  let match;
  let insideAnchor = false;

  while ((match = tagPattern.exec(html)) !== null) {
    // Get text before this tag
    const textBefore = html.substring(lastIndex, match.index);

    // Only linkify if we're not inside an anchor tag
    if (!insideAnchor && textBefore) {
      parts.push(linkifyText(textBefore));
    } else if (textBefore) {
      // SECURITY: Escape text inside anchor tags too
      parts.push(escapeHtmlChars(textBefore));
    }

    // Add the tag itself
    const tag = match[0];
    parts.push(tag);

    // Track if we're inside an anchor tag
    if (tag.match(/<a\s/i)) {
      insideAnchor = true;
    } else if (tag.match(/<\/a>/i)) {
      insideAnchor = false;
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last tag
  const remainingText = html.substring(lastIndex);
  if (!insideAnchor && remainingText) {
    parts.push(linkifyText(remainingText));
  } else if (remainingText) {
    // SECURITY: Escape remaining text inside anchor tags too
    parts.push(escapeHtmlChars(remainingText));
  }

  return parts.join('');
}
