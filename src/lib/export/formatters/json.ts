/**
 * JSON Formatter
 * 
 * Converts data structures to JSON format
 */

import { Formatter } from './index';

export class JsonFormatter implements Formatter {
  getMimeType(): string {
    return 'application/json';
  }

  getFileExtension(): string {
    return '.json';
  }

  async format(data: any, options?: any): Promise<string> {
    const indent = options?.pretty ? 2 : 0;
    return JSON.stringify(data, null, indent);
  }
}

// Export singleton instance
export const jsonFormatter = new JsonFormatter();
