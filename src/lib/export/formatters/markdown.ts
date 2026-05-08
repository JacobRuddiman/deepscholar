/**
 * Markdown Formatter
 *
 * Converts data structures to Markdown format
 */

import { Formatter } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData, ExportableData, ExportOptions } from '../types';

export class MarkdownFormatter implements Formatter {
  getMimeType(): string {
    return 'text/markdown';
  }

  getFileExtension(): string {
    return '.md';
  }

  async format(data: ExportableData, options?: ExportOptions): Promise<string> {
    // Determine data type and format accordingly
    if (this.isBriefData(data)) {
      return this.formatBrief(data, options);
    } else if (this.isUserProfileData(data)) {
      return this.formatUserProfile(data, options);
    } else if (this.isSearchResultsData(data)) {
      return this.formatSearchResults(data, options);
    } else {
      return this.formatGeneric(data);
    }
  }

  private isBriefData(data: unknown): data is BriefExportData {
    return data !== null && typeof data === 'object' && 'title' in data && typeof (data as Record<string, unknown>).title === 'string' && 'content' in data && typeof (data as Record<string, unknown>).content === 'string';
  }

  private isUserProfileData(data: unknown): data is UserProfileExportData {
    return data !== null && typeof data === 'object' && 'name' in data && typeof (data as Record<string, unknown>).name === 'string' && 'statistics' in data;
  }

  private isSearchResultsData(data: unknown): data is SearchResultsExportData {
    return data !== null && typeof data === 'object' && 'query' in data && typeof (data as Record<string, unknown>).query === 'string' && 'results' in data && Array.isArray((data as Record<string, unknown>).results);
  }

  private formatBrief(data: BriefExportData, options?: ExportOptions): string {
    let markdown = '';

    // Title
    markdown += `# ${data.title}\n\n`;

    // Metadata
    markdown += `**Author:** ${data.author.name}\n`;
    markdown += `**Model:** ${data.model.name} (${data.model.provider})\n`;
    markdown += `**Created:** ${new Date(data.statistics.createdAt).toLocaleDateString()}\n`;
    if (data.categories.length > 0) {
      markdown += `**Categories:** ${data.categories.join(', ')}\n`;
    }
    markdown += '\n---\n\n';

    // Abstract
    if (data.abstract) {
      markdown += `## Abstract\n\n${data.abstract}\n\n`;
    }

    // Main content
    markdown += `## Content\n\n${data.content}\n\n`;

    // Thinking process
    if (data.thinking && options?.includeThinking) {
      markdown += `## Thinking Process\n\n${data.thinking}\n\n`;
    }

    // References
    if (data.references.length > 0 && options?.includeReferences) {
      markdown += `## References\n\n`;
      data.references.forEach((ref, index) => {
        markdown += `${index + 1}. "${ref.highlightedText}" - [${ref.source.title}](${ref.source.url})\n`;
      });
      markdown += '\n';
    }

    // Sources
    if (data.sources.length > 0) {
      markdown += `## Sources\n\n`;
      data.sources.forEach((source, index) => {
        markdown += `${index + 1}. [${source.title}](${source.url})\n`;
      });
      markdown += '\n';
    }

    // Statistics
    if (options?.includeMetadata) {
      markdown += `## Statistics\n\n`;
      markdown += `- **Views:** ${data.statistics.viewCount}\n`;
      markdown += `- **Upvotes:** ${data.statistics.upvotes}\n`;
      if (data.statistics.readTime) {
        markdown += `- **Estimated Reading Time:** ${data.statistics.readTime} minutes\n`;
      }
      markdown += '\n';
    }

    return markdown;
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

  private formatUserProfile(data: UserProfileExportData, _options?: ExportOptions): string {
    let markdown = '';

    // Title
    markdown += `# User Profile: ${data.name}\n\n`;

    // Basic info
    if (data.bio) {
      markdown += `${data.bio}\n\n`;
    }

    markdown += `**Member since:** ${this.formatDate(data.joinedAt)}\n\n`;

    // Statistics
    markdown += `## Statistics\n\n`;
    markdown += `- **Briefs Created:** ${data.statistics.briefsCreated}\n`;
    markdown += `- **Reviews Written:** ${data.statistics.reviewsWritten}\n`;
    markdown += `- **Upvotes Received:** ${data.statistics.upvotesReceived}\n`;
    markdown += `- **Token Balance:** ${data.statistics.tokenBalance}\n\n`;

    // Recent briefs
    if (data.briefs.length > 0) {
      markdown += `## Recent Briefs\n\n`;
      data.briefs.forEach((brief, index) => {
        markdown += `${index + 1}. **${brief.title}**\n`;
        if (brief.abstract) {
          markdown += `   ${brief.abstract}\n`;
        }
        markdown += `   *Created: ${this.formatDate(brief.createdAt)} | Views: ${brief.viewCount} | Upvotes: ${brief.upvotes}*\n\n`;
      });
    }

    return markdown;
  }

  private formatSearchResults(data: SearchResultsExportData, _options?: ExportOptions): string {
    let markdown = '';

    // Title
    markdown += `# Search Results: "${data.query}"\n\n`;

    // Metadata
    markdown += `**Total Results:** ${data.totalResults}\n`;
    markdown += `**Search Date:** ${this.formatDate(data.searchMetadata.executedAt)}\n`;
    markdown += `**Execution Time:** ${data.searchMetadata.executionTime}ms\n\n`;

    // Filters
    if (Object.keys(data.filters).length > 0) {
      markdown += `## Applied Filters\n\n`;
      Object.entries(data.filters).forEach(([key, value]) => {
        markdown += `- **${key}:** ${Array.isArray(value) ? value.join(', ') : value}\n`;
      });
      markdown += '\n';
    }

    // Results
    markdown += `## Results\n\n`;
    data.results.forEach((result, index) => {
      markdown += `### ${index + 1}. ${result.title}\n\n`;
      if (result.abstract) {
        markdown += `${result.abstract}\n\n`;
      }
      markdown += `**Author:** ${result.author} | **Created:** ${this.formatDate(result.createdAt)}`;
      if (result.relevanceScore) {
        markdown += ` | **Relevance:** ${(result.relevanceScore * 100).toFixed(1)}%`;
      }
      markdown += '\n\n---\n\n';
    });

    return markdown;
  }

  private formatGeneric(data: ExportableData): string {
    // Fallback for generic data
    return `# Data Export\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
  }
}

// Export singleton instance
export const markdownFormatter = new MarkdownFormatter();
