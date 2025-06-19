/**
 * Plain Text Formatter
 * 
 * Converts data structures to plain text format
 */

import { Formatter } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData } from '../types';

export class TxtFormatter implements Formatter {
  getMimeType(): string {
    return 'text/plain';
  }

  getFileExtension(): string {
    return '.txt';
  }

  async format(data: any, options?: any): Promise<string> {
    if (this.isBriefData(data)) {
      return this.formatBrief(data, options);
    } else if (this.isUserProfileData(data)) {
      return this.formatUserProfile(data, options);
    } else if (this.isSearchResultsData(data)) {
      return this.formatSearchResults(data, options);
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
    let text = '';

    // Title
    text += `${data.title}\n`;
    text += '='.repeat(data.title.length) + '\n\n';

    // Metadata
    text += `Author: ${data.author.name}\n`;
    text += `Model: ${data.model.name} (${data.model.provider})\n`;
    text += `Created: ${this.formatDate(data.statistics.createdAt)}\n`;
    if (data.categories.length > 0) {
      text += `Categories: ${data.categories.join(', ')}\n`;
    }
    text += '\n' + '-'.repeat(50) + '\n\n';

    // Abstract
    if (data.abstract) {
      text += 'ABSTRACT\n\n';
      text += `${data.abstract}\n\n`;
    }

    // Main content
    text += 'CONTENT\n\n';
    text += `${data.content}\n\n`;

    // Thinking process
    if (data.thinking && options?.includeThinking) {
      text += 'THINKING PROCESS\n\n';
      text += `${data.thinking}\n\n`;
    }

    // References
    if (data.references.length > 0 && options?.includeReferences) {
      text += 'REFERENCES\n\n';
      data.references.forEach((ref, index) => {
        text += `${index + 1}. "${ref.highlightedText}"\n`;
        text += `   Source: ${ref.source.title} (${ref.source.url})\n\n`;
      });
    }

    // Sources
    if (data.sources.length > 0) {
      text += 'SOURCES\n\n';
      data.sources.forEach((source, index) => {
        text += `${index + 1}. ${source.title}\n`;
        text += `   ${source.url}\n\n`;
      });
    }

    // Statistics
    if (options?.includeMetadata) {
      text += 'STATISTICS\n\n';
      text += `Views: ${data.statistics.viewCount}\n`;
      text += `Upvotes: ${data.statistics.upvotes}\n`;
      if (data.statistics.readTime) {
        text += `Estimated Reading Time: ${data.statistics.readTime} minutes\n`;
      }
      text += '\n';
    }

    return text;
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    } else if (typeof date === 'string') {
      // Try to parse string date
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString();
      }
      return date; // Fallback to original string
    } else {
      return 'Unknown Date';
    }
  }

  private formatUserProfile(data: UserProfileExportData, options?: any): string {
    let text = '';

    // Title
    text += `USER PROFILE: ${data.name}\n`;
    text += '='.repeat(`USER PROFILE: ${data.name}`.length) + '\n\n';

    // Basic info
    if (data.bio) {
      text += `${data.bio}\n\n`;
    }

    text += `Member since: ${this.formatDate(data.joinedAt)}\n\n`;

    // Statistics
    text += 'STATISTICS\n\n';
    text += `Briefs Created: ${data.statistics.briefsCreated}\n`;
    text += `Reviews Written: ${data.statistics.reviewsWritten}\n`;
    text += `Upvotes Received: ${data.statistics.upvotesReceived}\n`;
    text += `Token Balance: ${data.statistics.tokenBalance}\n\n`;

    // Recent briefs
    if (data.briefs.length > 0) {
      text += 'RECENT BRIEFS\n\n';
      data.briefs.forEach((brief, index) => {
        text += `${index + 1}. ${brief.title}\n`;
        if (brief.abstract) {
          text += `   ${brief.abstract}\n`;
        }
        text += `   Created: ${this.formatDate(brief.createdAt)} | Views: ${brief.viewCount} | Upvotes: ${brief.upvotes}\n\n`;
      });
    }

    return text;
  }

  private formatSearchResults(data: SearchResultsExportData, options?: any): string {
    let text = '';

    // Title
    text += `SEARCH RESULTS: "${data.query}"\n`;
    text += '='.repeat(`SEARCH RESULTS: "${data.query}"`.length) + '\n\n';

    // Metadata
    text += `Total Results: ${data.totalResults}\n`;
    text += `Search Date: ${this.formatDate(data.searchMetadata.executedAt)}\n`;
    text += `Execution Time: ${data.searchMetadata.executionTime}ms\n\n`;

    // Filters
    if (Object.keys(data.filters).length > 0) {
      text += 'APPLIED FILTERS\n\n';
      Object.entries(data.filters).forEach(([key, value]) => {
        text += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
      });
      text += '\n';
    }

    // Results
    text += 'RESULTS\n\n';
    data.results.forEach((result, index) => {
      text += `${index + 1}. ${result.title}\n`;
      text += '-'.repeat(result.title.length + 3) + '\n';
      if (result.abstract) {
        text += `${result.abstract}\n\n`;
      }
      text += `Author: ${result.author} | Created: ${this.formatDate(result.createdAt)}`;
      if (result.relevanceScore) {
        text += ` | Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`;
      }
      text += '\n\n';
    });

    return text;
  }

  private formatGeneric(data: any, options?: any): string {
    return `DATA EXPORT\n${'='.repeat(11)}\n\n${JSON.stringify(data, null, 2)}\n`;
  }
}

// Export singleton instance
export const txtFormatter = new TxtFormatter();
