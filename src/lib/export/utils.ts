/**
 * Export Utilities
 *
 * Common utility functions for export operations
 */

import { ExportFormat, ExportType, ExportMetadata, ExportOptions, ExportableData } from './types';
import { logger } from '@/lib/logger';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export class ExportUtils {
  /**
   * Generate a filename for an export
   */
  static generateFilename(
    type: ExportType,
    format: ExportFormat,
    title?: string,
    timestamp?: Date
  ): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let baseName = '';
    
    if (title) {
      // Sanitize title for filename
      baseName = title
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 50); // Limit length
    } else {
      baseName = `${type}_export`;
    }
    
    return `${baseName}_${dateStr}.${format}`;
  }

  /**
   * Get MIME type for a format
   */
  static getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      pdf: 'application/pdf',
      markdown: 'text/markdown',
      html: 'text/html',
      json: 'application/json',
      csv: 'text/csv',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain'
    };
    
    return mimeTypes[format];
  }

  /**
   * Get file extension for a format
   */
  static getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      pdf: '.pdf',
      markdown: '.md',
      html: '.html',
      json: '.json',
      csv: '.csv',
      docx: '.docx',
      txt: '.txt'
    };
    
    return extensions[format];
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate export metadata
   */
  static generateMetadata(
    type: ExportType,
    title: string,
    createdBy: string,
    options?: Partial<ExportMetadata>
  ): ExportMetadata {
    return {
      title,
      createdBy,
      exportedAt: new Date(),
      source: 'DeepScholar',
      version: '1.0',
      ...options
    };
  }

  /**
   * Compress data using gzip compression
   * Only compress if the data is larger than 1KB to avoid overhead
   */
  static async compressData(data: string | Buffer): Promise<Buffer> {
    try {
      const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

      // Only compress if data is larger than 1KB (1024 bytes)
      // Smaller files don't benefit from compression and may actually get larger
      if (buffer.length < 1024) {
        return buffer;
      }

      const compressed = await gzipAsync(buffer);

      // Only return compressed version if it's actually smaller
      if (compressed.length < buffer.length) {
        logger.debug('Data compressed', {
          originalSize: buffer.length,
          compressedSize: compressed.length,
          ratio: ((1 - compressed.length / buffer.length) * 100).toFixed(2) + '%',
        });
        return compressed;
      }

      // If compression didn't help, return original
      return buffer;
    } catch (error) {
      logger.error('Failed to compress data', error);
      // If compression fails, return the data as-is
      const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      return buffer;
    }
  }

  /**
   * Calculate estimated processing time
   */
  static estimateProcessingTime(
    dataSize: number,
    format: ExportFormat,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ): number {
    // Base time in milliseconds
    let baseTime = 1000; // 1 second
    
    // Adjust for format complexity
    const formatMultipliers: Record<ExportFormat, number> = {
      txt: 0.5,
      json: 0.7,
      csv: 0.8,
      markdown: 1.0,
      html: 1.2,
      pdf: 2.0,
      docx: 1.8
    };
    
    // Adjust for data size (per KB)
    const sizeMultiplier = Math.max(1, dataSize / 1024);
    
    // Adjust for complexity
    const complexityMultipliers = {
      low: 0.7,
      medium: 1.0,
      high: 1.5
    };
    
    return Math.round(
      baseTime * 
      formatMultipliers[format] * 
      sizeMultiplier * 
      complexityMultipliers[complexity]
    );
  }

  /**
   * Validate export data structure
   */
  static validateDataStructure(data: unknown, type: ExportType): boolean {
    if (!data || typeof data !== 'object') return false;
    const record = data as Record<string, unknown>;

    switch (type) {
      case 'brief':
        return typeof record.title === 'string' &&
               typeof record.content === 'string' &&
               record.author !== null &&
               typeof record.author === 'object' &&
               typeof (record.author as Record<string, unknown>).name === 'string';

      case 'user_profile':
        return typeof record.name === 'string' &&
               record.statistics !== null &&
               typeof record.statistics === 'object' &&
               typeof (record.statistics as Record<string, unknown>).briefsCreated === 'number';

      case 'search_results':
        return typeof record.query === 'string' &&
               Array.isArray(record.results);

      default:
        return true; // Allow other types for now
    }
  }

  /**
   * Clean and prepare data for export
   */
  static cleanDataForExport(data: ExportableData): ExportableData {
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    const cleanObject = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }

      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          cleaned[key] = cleanObject(value);
        }
      }

      return cleaned;
    };

    return cleanObject(data) as ExportableData;
  }

  /**
   * Generate download URL for exported file
   */
  static generateDownloadUrl(filename: string, baseUrl?: string): string {
    const base = baseUrl || '/api/export/download';
    return `${base}/${encodeURIComponent(filename)}`;
  }

  /**
   * Parse export options from query parameters
   */
  static parseExportOptions(queryParams: Record<string, string | string[]>): ExportOptions {
    const options: ExportOptions = {};

    // Boolean options
    const booleanOptionKeys = ['includeMetadata', 'includeReferences', 'includeComments', 'compression'] as const;
    booleanOptionKeys.forEach(option => {
      if (queryParams[option]) {
        (options as Record<string, unknown>)[option] = queryParams[option] === 'true';
      }
    });

    // String options
    if (queryParams.template && typeof queryParams.template === 'string') {
      options.template = queryParams.template;
    }
    if (queryParams.watermark && typeof queryParams.watermark === 'string') {
      options.watermark = queryParams.watermark;
    }
    if (queryParams.pageSize && typeof queryParams.pageSize === 'string') {
      options.pageSize = queryParams.pageSize as 'A4' | 'Letter' | 'Legal';
    }
    if (queryParams.orientation && typeof queryParams.orientation === 'string') {
      options.orientation = queryParams.orientation as 'portrait' | 'landscape';
    }

    // Styling options
    if (queryParams.theme || queryParams.fontSize || queryParams.fontFamily) {
      options.styling = {};
      if (queryParams.theme && typeof queryParams.theme === 'string') {
        options.styling.theme = queryParams.theme as 'light' | 'dark' | 'academic' | 'minimal';
      }
      if (queryParams.fontSize && typeof queryParams.fontSize === 'string') {
        options.styling.fontSize = parseInt(queryParams.fontSize);
      }
      if (queryParams.fontFamily && typeof queryParams.fontFamily === 'string') {
        options.styling.fontFamily = queryParams.fontFamily;
      }
    }

    return options;
  }

  /**
   * Log export activity
   */
  static logExportActivity(
    userId: string,
    type: ExportType,
    format: ExportFormat,
    success: boolean,
    fileSize?: number,
    processingTime?: number
  ): void {
    logger.export('Export activity logged', {
      userId,
      type,
      format,
      success,
      fileSize,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export constants
export const EXPORT_CONSTANTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_PROCESSING_TIME: 5 * 60 * 1000, // 5 minutes
  SUPPORTED_FORMATS: ['pdf', 'markdown', 'html', 'json', 'csv', 'docx', 'txt'] as ExportFormat[],
  SUPPORTED_TYPES: ['brief', 'user_profile', 'search_results', 'category', 'collection', 'analytics'] as ExportType[],
  DEFAULT_PAGE_SIZE: 'A4' as const,
  DEFAULT_ORIENTATION: 'portrait' as const,
  DEFAULT_THEME: 'light' as const
};
