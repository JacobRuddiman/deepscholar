/**
 * Export Generators - Main Entry Point
 * 
 * Handles generation of export files including PDF, DOCX, and other binary formats
 */

export * from './pdf';
export * from './docx';

// Base generator interface
export interface Generator {
  generate(data: any, options?: any): Promise<Buffer>;
  getMimeType(): string;
  getFileExtension(): string;
}

// Generator registry
export class GeneratorRegistry {
  private static generators = new Map<string, Generator>();

  static register(format: string, generator: Generator) {
    this.generators.set(format, generator);
  }

  static get(format: string): Generator | undefined {
    return this.generators.get(format);
  }

  static getAvailableFormats(): string[] {
    return Array.from(this.generators.keys());
  }
}
