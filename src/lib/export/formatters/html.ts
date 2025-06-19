/**
 * HTML Formatter
 * 
 * Converts data structures to HTML format
 */

import { Formatter } from './index';
import { BriefExportData, UserProfileExportData, SearchResultsExportData } from '../types';

export class HtmlFormatter implements Formatter {
  getMimeType(): string {
    return 'text/html';
  }

  getFileExtension(): string {
    return '.html';
  }

  async format(data: any, options?: any): Promise<string> {
    const theme = options?.styling?.theme || 'light';
    const title = options?.metadata?.title || 'DeepScholar Export';
    
    let content = '';
    
    if (this.isBriefData(data)) {
      content = this.formatBrief(data, options);
    } else if (this.isUserProfileData(data)) {
      content = this.formatUserProfile(data, options);
    } else if (this.isSearchResultsData(data)) {
      content = this.formatSearchResults(data, options);
    } else {
      content = this.formatGeneric(data, options);
    }

    return this.wrapInHtml(content, title, theme);
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
    let html = `<h1>${this.escapeHtml(data.title)}</h1>`;
    
    // Metadata section
    html += '<div class="metadata">';
    html += `<p><strong>Author:</strong> ${this.escapeHtml(data.author.name)}</p>`;
    html += `<p><strong>Model:</strong> ${this.escapeHtml(data.model.name)} (${this.escapeHtml(data.model.provider)})</p>`;
    html += `<p><strong>Created:</strong> ${this.formatDate(data.statistics.createdAt)}</p>`;
    if (data.categories.length > 0) {
      html += `<p><strong>Categories:</strong> ${data.categories.map(c => this.escapeHtml(c)).join(', ')}</p>`;
    }
    html += '</div>';

    // Abstract
    if (data.abstract) {
      html += `<h2>Abstract</h2><div class="abstract">${this.formatText(data.abstract)}</div>`;
    }

    // Main content
    html += `<h2>Content</h2><div class="content">${this.formatText(data.content)}</div>`;

    // References
    if (data.references.length > 0 && options?.includeReferences) {
      html += '<h2>References</h2><ol class="references">';
      data.references.forEach(ref => {
        html += `<li>"${this.escapeHtml(ref.highlightedText)}" - <a href="${ref.source.url}" target="_blank">${this.escapeHtml(ref.source.title)}</a></li>`;
      });
      html += '</ol>';
    }

    return html;
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
    let html = `<h1>User Profile: ${this.escapeHtml(data.name)}</h1>`;
    
    if (data.bio) {
      html += `<div class="bio">${this.formatText(data.bio)}</div>`;
    }

    html += `<p><strong>Member since:</strong> ${this.formatDate(data.joinedAt)}</p>`;

    // Statistics
    html += '<h2>Statistics</h2><ul class="statistics">';
    html += `<li><strong>Briefs Created:</strong> ${data.statistics.briefsCreated}</li>`;
    html += `<li><strong>Reviews Written:</strong> ${data.statistics.reviewsWritten}</li>`;
    html += `<li><strong>Upvotes Received:</strong> ${data.statistics.upvotesReceived}</li>`;
    html += `<li><strong>Token Balance:</strong> ${data.statistics.tokenBalance}</li>`;
    html += '</ul>';

    return html;
  }

  private formatSearchResults(data: SearchResultsExportData, options?: any): string {
    let html = `<h1>Search Results: "${this.escapeHtml(data.query)}"</h1>`;
    
    html += '<div class="search-metadata">';
    html += `<p><strong>Total Results:</strong> ${data.totalResults}</p>`;
    html += `<p><strong>Search Date:</strong> ${this.formatDate(data.searchMetadata.executedAt)}</p>`;
    html += '</div>';

    html += '<div class="results">';
    data.results.forEach((result, index) => {
      html += `<div class="result-item">`;
      html += `<h3>${index + 1}. ${this.escapeHtml(result.title)}</h3>`;
      if (result.abstract) {
        html += `<p>${this.escapeHtml(result.abstract)}</p>`;
      }
      html += `<div class="result-meta">Author: ${this.escapeHtml(result.author)} | Created: ${this.formatDate(result.createdAt)}</div>`;
      html += `</div>`;
    });
    html += '</div>';

    return html;
  }

  private formatGeneric(data: any, options?: any): string {
    return `<h1>Data Export</h1><pre><code>${this.escapeHtml(JSON.stringify(data, null, 2))}</code></pre>`;
  }

  private wrapInHtml(content: string, title: string, theme: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        ${this.getStyles(theme)}
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
  }

  private getStyles(theme: string): string {
    const baseStyles = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #333; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .abstract, .content { margin: 20px 0; }
        .references { margin: 20px 0; }
        .result-item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .result-meta { color: #666; font-size: 0.9em; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    `;

    if (theme === 'dark') {
      return baseStyles + `
        body { background: #1a1a1a; color: #e0e0e0; }
        h1, h2, h3 { color: #ffffff; }
        .metadata { background: #2a2a2a; }
        pre { background: #2a2a2a; }
        .result-item { border-bottom-color: #333; }
        .result-meta { color: #aaa; }
      `;
    }

    return baseStyles;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatText(text: string): string {
    // Simple text formatting - convert line breaks to paragraphs
    return text.split('\n\n').map(paragraph => 
      `<p>${this.escapeHtml(paragraph.replace(/\n/g, '<br>'))}</p>`
    ).join('');
  }
}

// Export singleton instance
export const htmlFormatter = new HtmlFormatter();
