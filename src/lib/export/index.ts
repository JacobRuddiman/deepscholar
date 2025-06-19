/**
 * Export Library - Main Entry Point
 * 
 * This module provides a unified interface for all content export functionality
 * including PDF generation, API access, data serialization, and format conversion.
 */

// Re-export all export utilities for easy access
export * from './types';
export * from './formatters';
export * from './generators';
export * from './validators';
export * from './utils';

// Main export service class
export { ExportService } from './services/ExportService';

// Export format constants
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  MARKDOWN: 'markdown',
  HTML: 'html',
  JSON: 'json',
  CSV: 'csv',
  DOCX: 'docx',
  TXT: 'txt',
} as const;

// Export types constants
export const EXPORT_TYPES = {
  BRIEF: 'brief',
  USER_PROFILE: 'user_profile',
  SEARCH_RESULTS: 'search_results',
  CATEGORY: 'category',
  COLLECTION: 'collection',
  ANALYTICS: 'analytics',
} as const;
