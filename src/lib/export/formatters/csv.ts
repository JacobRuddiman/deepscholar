/**
 * CSV Formatter
 * 
 * Converts data structures to CSV format
 */

import { Formatter } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData } from '../types';

export class CsvFormatter implements Formatter {
  getMimeType(): string {
    return 'text/csv';
  }

  getFileExtension(): string {
    return '.csv';
  }

  async format(data: any, options?: any): Promise<string> {
    if (this.isBriefData(data)) {
      return this.formatBrief(data, options);
    } else if (this.isUserProfileData(data)) {
      return this.formatUserProfile(data, options);
    } else if (this.isSearchResultsData(data)) {
      return this.formatSearchResults(data, options);
    } else if (Array.isArray(data)) {
      return this.formatArray(data, options);
    } else {
      return this.formatGeneric(data, options);
    }
  }

  private isBriefData(data: any): data is BriefExportData {
    return data && typeof data.title === 'string' && typeof data.content === 'string';
  }

  private isUserProfileData(data: any): data is UserProfileExportData {
    return data && typeof data.name === 'string' && data.statistics;
  }

  private isSearchResultsData(data: any): data is SearchResultsExportData {
    return data && typeof data.query === 'string' && Array.isArray(data.results);
  }

  private formatBrief(data: BriefExportData, options?: any): string {
    const headers = [
      'ID', 'Title', 'Author', 'Model', 'Provider', 'Created', 'Categories',
      'View Count', 'Upvotes', 'Abstract', 'Content Length'
    ];

    const row = [
      data.id,
      data.title,
      data.author.name,
      data.model.name,
      data.model.provider,
      this.formatDate(data.statistics.createdAt),
      data.categories.join('; '),
      data.statistics.viewCount.toString(),
      data.statistics.upvotes.toString(),
      data.abstract || '',
      data.content.length.toString()
    ];

    return this.arrayToCsv([headers, row]);
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    } else if (typeof date === 'string') {
      // Try to parse string date
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
      return date; // Fallback to original string
    } else {
      return 'Unknown Date';
    }
  }

  private formatUserProfile(data: UserProfileExportData, options?: any): string {
    const headers = [
      'ID', 'Name', 'Email', 'Joined', 'Briefs Created', 'Reviews Written',
      'Upvotes Received', 'Token Balance'
    ];

    const row = [
      data.id,
      data.name,
      data.email || '',
      this.formatDate(data.joinedAt),
      data.statistics.briefsCreated.toString(),
      data.statistics.reviewsWritten.toString(),
      data.statistics.upvotesReceived.toString(),
      data.statistics.tokenBalance.toString()
    ];

    return this.arrayToCsv([headers, row]);
  }

  private formatSearchResults(data: SearchResultsExportData, options?: any): string {
    const headers = [
      'Rank', 'ID', 'Title', 'Author', 'Created', 'Relevance Score', 'Abstract'
    ];

    const rows = data.results.map((result, index) => [
      (index + 1).toString(),
      result.id,
      result.title,
      result.author,
      this.formatDate(result.createdAt),
      result.relevanceScore?.toString() || '',
      result.abstract || ''
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private formatArray(data: any[], options?: any): string {
    if (data.length === 0) return '';

    // Extract headers from first object
    const firstItem = data[0];
    const headers = Object.keys(firstItem);

    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return value.toString();
      })
    );

    return this.arrayToCsv([headers, ...rows]);
  }

  private formatGeneric(data: any, options?: any): string {
    // Convert object to key-value pairs
    const entries = Object.entries(data);
    const headers = ['Key', 'Value'];
    const rows = entries.map(([key, value]) => [
      key,
      typeof value === 'object' ? JSON.stringify(value) : value?.toString() || ''
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private arrayToCsv(data: string[][]): string {
    return data.map(row => 
      row.map(cell => this.escapeCsvCell(cell)).join(',')
    ).join('\n');
  }

  private escapeCsvCell(cell: string): string {
    // Escape quotes and wrap in quotes if necessary
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }
}

// Export singleton instance
export const csvFormatter = new CsvFormatter();
