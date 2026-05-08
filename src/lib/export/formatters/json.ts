/**
 * JSON Formatter
 *
 * Converts data structures to JSON format
 */

import { Formatter } from './index';
import { ExportableData, ExportOptions } from '../types';

export class JsonFormatter implements Formatter {
  getMimeType(): string {
    return 'application/json';
  }

  getFileExtension(): string {
    return '.json';
  }

  async format(data: ExportableData, options?: ExportOptions): Promise<string> {
    const indent = options?.template === 'pretty' ? 2 : 2; // Always pretty print for readability
    return JSON.stringify(data, null, indent);
  }
}

// Export singleton instance
export const jsonFormatter = new JsonFormatter();
