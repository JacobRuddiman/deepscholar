/**
 * Export Formatters - Main Entry Point
 * 
 * Handles conversion of data into various export formats
 */

export * from './markdown';
export * from './html';
export * from './json';
export * from './csv';
export * from './txt';

// Base formatter interface
export interface Formatter {
  format(data: any, options?: any): Promise<string>;
  getMimeType(): string;
  getFileExtension(): string;
}

// Formatter registry
export class FormatterRegistry {
  private static formatters = new Map<string, Formatter>();

  static register(format: string, formatter: Formatter) {
    this.formatters.set(format, formatter);
  }

  static get(format: string): Formatter | undefined {
    return this.formatters.get(format);
  }

  static getAvailableFormats(): string[] {
    return Array.from(this.formatters.keys());
  }
}
