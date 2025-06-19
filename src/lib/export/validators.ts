/**
 * Export Validators
 * 
 * Validates export requests and data before processing
 */

import { ExportRequest, ExportFormat, ExportType, ExportOptions } from './types';

export class ExportValidator {
  static validateRequest(request: ExportRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!request.type) {
      errors.push('Export type is required');
    }

    if (!request.format) {
      errors.push('Export format is required');
    }

    if (!request.id) {
      errors.push('Export ID is required');
    }

    // Validate format
    if (request.format && !this.isValidFormat(request.format)) {
      errors.push(`Invalid export format: ${request.format}`);
    }

    // Validate type
    if (request.type && !this.isValidType(request.type)) {
      errors.push(`Invalid export type: ${request.type}`);
    }

    // Validate options if provided
    if (request.options) {
      const optionErrors = this.validateOptions(request.options);
      errors.push(...optionErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidFormat(format: string): format is ExportFormat {
    const validFormats: ExportFormat[] = ['pdf', 'markdown', 'html', 'json', 'csv', 'docx', 'txt'];
    return validFormats.includes(format as ExportFormat);
  }

  static isValidType(type: string): type is ExportType {
    const validTypes: ExportType[] = ['brief', 'user_profile', 'search_results', 'category', 'collection', 'analytics'];
    return validTypes.includes(type as ExportType);
  }

  static validateOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    // Validate page size
    if (options.pageSize && !['A4', 'Letter', 'Legal'].includes(options.pageSize)) {
      errors.push(`Invalid page size: ${options.pageSize}`);
    }

    // Validate orientation
    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push(`Invalid orientation: ${options.orientation}`);
    }

    // Validate styling theme
    if (options.styling?.theme && !['light', 'dark', 'academic', 'minimal'].includes(options.styling.theme)) {
      errors.push(`Invalid theme: ${options.styling.theme}`);
    }

    // Validate font size
    if (options.styling?.fontSize && (options.styling.fontSize < 8 || options.styling.fontSize > 72)) {
      errors.push('Font size must be between 8 and 72');
    }

    // Validate margins
    if (options.styling?.margins) {
      const { top, right, bottom, left } = options.styling.margins;
      if (top < 0 || right < 0 || bottom < 0 || left < 0) {
        errors.push('Margins must be non-negative');
      }
    }

    return errors;
  }

  static validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
    return size <= maxSize; // Default 50MB limit
  }

  static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  }

  static validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }
}

// Export validation schemas for common use cases
export const VALIDATION_SCHEMAS = {
  BRIEF_EXPORT: {
    requiredFields: ['id', 'title', 'content', 'author'],
    optionalFields: ['abstract', 'thinking', 'sources', 'references']
  },
  USER_PROFILE_EXPORT: {
    requiredFields: ['id', 'name', 'statistics'],
    optionalFields: ['email', 'bio', 'briefs', 'preferences']
  },
  SEARCH_RESULTS_EXPORT: {
    requiredFields: ['query', 'results', 'searchMetadata'],
    optionalFields: ['filters']
  }
};

// Rate limiting for exports
export class ExportRateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly MAX_REQUESTS_PER_HOUR = 10;
  private static readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour

  static isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => now - time < this.WINDOW_MS);
    
    // Update the map
    this.requests.set(userId, recentRequests);
    
    // Check if limit exceeded
    return recentRequests.length >= this.MAX_REQUESTS_PER_HOUR;
  }

  static recordRequest(userId: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    userRequests.push(now);
    this.requests.set(userId, userRequests);
  }

  static getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < this.WINDOW_MS);
    return Math.max(0, this.MAX_REQUESTS_PER_HOUR - recentRequests.length);
  }
}
