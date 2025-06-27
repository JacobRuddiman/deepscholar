/**
 * Converts a string to a URL-friendly slug
 * @param str The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
} 

// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values and merges Tailwind CSS classes intelligently
 * 
 * This utility function:
 * 1. Uses clsx to handle conditional classes and arrays
 * 2. Uses twMerge to resolve Tailwind CSS class conflicts
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A single string of merged classes
 * 
 * @example
 * cn('px-2 py-1', 'px-3') // Returns 'py-1 px-3' (px-3 overrides px-2)
 * cn('text-red-500', { 'text-blue-500': isBlue }) // Conditionally applies classes
 * cn(['bg-white', 'text-black'], undefined, 'hover:bg-gray-100') // Handles arrays and undefined
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Additional utility functions that are commonly used alongside cn

/**
 * Creates a variant-based className function for component styling
 * Useful for components with multiple visual variants
 */
export function cva(base: string, variants: Record<string, Record<string, string>>) {
  return function(props: Record<string, any>) {
    const classes = [base];
    
    Object.entries(variants).forEach(([key, values]) => {
      const value = props[key];
      if (value && values[value]) {
        classes.push(values[value]);
      }
    });
    
    return cn(...classes, props.className);
  };
}

/**
 * Type-safe event handler that prevents default and stops propagation
 */
export function preventDefault<T extends React.SyntheticEvent>(
  handler?: (event: T) => void
) {
  return (event: T) => {
    event.preventDefault();
    event.stopPropagation();
    handler?.(event);
  };
}

/**
 * Safely formats numbers for display
 */
export function formatNumber(
  num: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', options).format(num);
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}