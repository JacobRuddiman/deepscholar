'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  /**
   * Image source URL
   */
  src: string;
  /**
   * Alt text for accessibility
   */
  alt: string;
  /**
   * Image width
   */
  width?: number;
  /**
   * Image height
   */
  height?: number;
  /**
   * Fill container (responsive)
   */
  fill?: boolean;
  /**
   * CSS class name
   */
  className?: string;
  /**
   * Object fit style
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /**
   * Priority loading (LCP images)
   */
  priority?: boolean;
  /**
   * Quality (1-100)
   */
  quality?: number;
  /**
   * Placeholder blur data URL or 'blur' | 'empty'
   */
  placeholder?: 'blur' | 'empty';
  /**
   * Blur data URL (base64)
   */
  blurDataURL?: string;
  /**
   * Lazy load when in viewport
   */
  lazy?: boolean;
}

/**
 * Optimized image component with Next.js Image optimization
 * Includes lazy loading, blur placeholders, and error handling
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  objectFit = 'cover',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  lazy = true,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use a fallback image if the original fails to load
  const fallbackSrc = '/images/placeholder.png';

  if (error) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps = {
    src: src || fallbackSrc,
    alt,
    quality,
    priority,
    className: `${className} ${loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`,
    onError: () => setError(true),
    onLoad: () => setLoading(false),
    ...(placeholder === 'blur' && blurDataURL ? { placeholder, blurDataURL } : {}),
    ...(fill
      ? { fill: true, style: { objectFit } }
      : { width, height, style: { objectFit } }),
  };

  return (
    <div className="relative">
      {loading && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={fill ? undefined : { width, height }}
        />
      )}
      <Image
        {...imageProps}
        loading={priority ? undefined : lazy ? 'lazy' : undefined}
      />
    </div>
  );
}

/**
 * Avatar image component with fallback
 */
export function Avatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    // Generate initials from alt text
    const initials = alt
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold rounded-full ${className}`}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        onError={() => setError(true)}
      />
    </div>
  );
}

/**
 * Generate a blur placeholder from an image URL
 * This would typically be done at build time
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  // In production, you'd use a service to generate blur placeholders
  // For now, return a simple gray blur
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZWVlZSIvPjwvc3ZnPg==';
}
