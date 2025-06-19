/**
 * Export Utilities
 * 
 * Common utility functions for export operations
 */

import { ExportFormat, ExportType, ExportMetadata } from './types';

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
   * Compress data if needed
   */
  static async compressData(data: string | Buffer): Promise<Buffer> {
    // TODO: Implement compression using zlib or similar
    // For now, just return the data as buffer
    if (typeof data === 'string') {
      return Buffer.from(data, 'utf-8');
    }
    return data;
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
  static validateDataStructure(data: any, type: ExportType): boolean {
    switch (type) {
      case 'brief':
        return data && 
               typeof data.title === 'string' && 
               typeof data.content === 'string' &&
               data.author && 
               typeof data.author.name === 'string';
      
      case 'user_profile':
        return data && 
               typeof data.name === 'string' && 
               data.statistics &&
               typeof data.statistics.briefsCreated === 'number';
      
      case 'search_results':
        return data && 
               typeof data.query === 'string' && 
               Array.isArray(data.results);
      
      default:
        return true; // Allow other types for now
    }
  }

  /**
   * Clean and prepare data for export
   */
  static cleanDataForExport(data: any): any {
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          cleaned[key] = cleanObject(value);
        }
      }
      
      return cleaned;
    };
    
    return cleanObject(data);
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
  static parseExportOptions(queryParams: Record<string, string | string[]>): any {
    const options: any = {};
    
    // Boolean options
    const booleanOptions = ['includeMetadata', 'includeReferences', 'includeComments', 'compression'];
    booleanOptions.forEach(option => {
      if (queryParams[option]) {
        options[option] = queryParams[option] === 'true';
      }
    });
    
    // String options
    const stringOptions = ['template', 'watermark', 'pageSize', 'orientation'];
    stringOptions.forEach(option => {
      if (queryParams[option] && typeof queryParams[option] === 'string') {
        options[option] = queryParams[option];
      }
    });
    
    // Styling options
    if (queryParams.theme || queryParams.fontSize || queryParams.fontFamily) {
      options.styling = {};
      if (queryParams.theme) options.styling.theme = queryParams.theme;
      if (queryParams.fontSize) options.styling.fontSize = parseInt(queryParams.fontSize as string);
      if (queryParams.fontFamily) options.styling.fontFamily = queryParams.fontFamily;
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
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      type,
      format,
      success,
      fileSize,
      processingTime
    };
    
    // TODO: Implement actual logging (database, file, or external service)
    console.log('Export Activity:', logEntry);
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
