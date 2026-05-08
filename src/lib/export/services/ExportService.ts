/**
 * Export Service - Main Export Orchestrator
 * 
 * Coordinates all export operations including data fetching, formatting, and generation
 */

import {
  ExportRequest,
  ExportResponse,
  ExportFormat,
  ExportType,
  ExportOptions,
  ExportData,
  ExportableData,
  ExportGenerationResult,
  ExportHistoryRecord,
  ExportUsageStats,
  BriefExportData,
  UserProfileExportData,
  SearchResultsExportData
} from '../types';
import { ExportValidator, ExportRateLimiter } from '../validators';
import { ExportUtils } from '../utils';
import { FormatterRegistry } from '../formatters';
import { GeneratorRegistry } from '../generators';
import { db } from '@/server/db';

// Import formatters
import { markdownFormatter } from '../formatters/markdown';
import { htmlFormatter } from '../formatters/html';
import { jsonFormatter } from '../formatters/json';
import { csvFormatter } from '../formatters/csv';
import { txtFormatter } from '../formatters/txt';

// Import generators
import { pdfGenerator } from '../generators/pdf';
import { docxGenerator } from '../generators/docx';

export class ExportService {
  private static instance: ExportService;
  private initialized = false;
  private mockExportHistory: ExportHistoryRecord[] = [];
  private mockUsageStats: ExportUsageStats = {
    today: 0,
    thisMonth: 0,
    total: 0,
    remaining: 10
  };

  private constructor() {
    this.initializeFormatters();
    this.initializeGenerators();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private initializeFormatters(): void {
    if (this.initialized) return;
    
    // Register all formatters
    FormatterRegistry.register('markdown', markdownFormatter);
    FormatterRegistry.register('html', htmlFormatter);
    FormatterRegistry.register('json', jsonFormatter);
    FormatterRegistry.register('csv', csvFormatter);
    FormatterRegistry.register('txt', txtFormatter);
    
    this.initialized = true;
  }

  private initializeGenerators(): void {
    // Register all generators
    GeneratorRegistry.register('pdf', pdfGenerator);
    GeneratorRegistry.register('docx', docxGenerator);
  }

  /**
   * Main export method
   */
  async export(request: ExportRequest, userId: string): Promise<ExportResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validation = ExportValidator.validateRequest(request);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          generatedAt: new Date()
        };
      }

      // Check rate limiting
      const remainingRequests = await this.getRemainingRequests(userId);
      
      if (remainingRequests <= 0) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again tomorrow.',
          generatedAt: new Date()
        };
      }

      // Fetch data
      const data = await this.fetchData(request.type, request.id);
      
      if (!data) {
        return {
          success: false,
          error: 'Data not found or access denied',
          generatedAt: new Date()
        };
      }

      // Validate data structure
      const isValidStructure = ExportUtils.validateDataStructure(data, request.type);
      
      if (!isValidStructure) {
        return {
          success: false,
          error: 'Invalid data structure for export type',
          generatedAt: new Date()
        };
      }

      // Clean data
      const cleanedData = ExportUtils.cleanDataForExport(data);

      // Generate export
      const result = await this.generateExport(request.format, cleanedData, request.options);

      // Record export in database
      await this.recordExport(userId, request, result);

      // Log activity
      const processingTime = Date.now() - startTime;
      ExportUtils.logExportActivity(
        userId,
        request.type,
        request.format,
        true,
        result.size,
        processingTime
      );

      return {
        success: true,
        data: result.data,
        filename: result.filename,
        size: result.size,
        downloadUrl: result.downloadUrl,
        generatedAt: new Date()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('💥 Export error:', error);
      console.error('📚 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      ExportUtils.logExportActivity(
        userId,
        request.type,
        request.format,
        false,
        undefined,
        processingTime
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        generatedAt: new Date()
      };
    }
  }

  /**
   * Generate export in specified format
   */
  private async generateExport(
    format: ExportFormat,
    data: ExportableData,
    options?: ExportOptions
  ): Promise<ExportGenerationResult> {
    // Check if format requires binary generation (PDF, DOCX)
    const binaryFormats: ExportFormat[] = ['pdf', 'docx'];

    if (binaryFormats.includes(format)) {
      return this.generateBinaryExport(format, data, options);
    } else {
      return this.generateTextExport(format, data, options);
    }
  }

  /**
   * Generate text-based export (markdown, html, json, csv, txt)
   */
  private async generateTextExport(
    format: ExportFormat,
    data: ExportableData,
    options?: ExportOptions
  ): Promise<ExportGenerationResult> {
    const formatter = FormatterRegistry.get(format);
    if (!formatter) {
      throw new Error(`No formatter found for format: ${format}`);
    }

    const content = await formatter.format(data, options);
    const mimeType = formatter.getMimeType();

    // Generate filename
    const title = this.extractTitle(data);
    const filename = ExportUtils.generateFilename('brief', format, title);

    // Calculate size
    const size = Buffer.byteLength(content, 'utf-8');

    // Validate file size
    if (!ExportValidator.validateFileSize(size)) {
      throw new Error('Generated file exceeds maximum size limit');
    }

    const result = {
      data: {
        content,
        mimeType,
        encoding: 'utf-8'
      },
      filename,
      size,
      downloadUrl: ExportUtils.generateDownloadUrl(filename)
    };
    
    return result;
  }

  /**
   * Generate binary export (PDF, DOCX)
   */
  private async generateBinaryExport(
    format: ExportFormat,
    data: ExportableData,
    options?: ExportOptions
  ): Promise<ExportGenerationResult> {
    const generator = GeneratorRegistry.get(format);
    if (!generator) {
      throw new Error(`No generator found for format: ${format}`);
    }

    const buffer = await generator.generate(data, options);
    const mimeType = generator.getMimeType();
    
    // Generate filename
    const title = this.extractTitle(data);
    const filename = ExportUtils.generateFilename('brief', format, title);
    
    // Calculate size
    const size = buffer.length;
    
    // Validate file size
    if (!ExportValidator.validateFileSize(size)) {
      throw new Error('Generated file exceeds maximum size limit');
    }

    return {
      data: {
        content: buffer,
        mimeType,
        encoding: 'binary'
      },
      filename,
      size,
      downloadUrl: ExportUtils.generateDownloadUrl(filename)
    };
  }

  /**
   * Extract a title string from exportable data for filename generation
   */
  private extractTitle(data: ExportableData): string {
    if ('title' in data && data.title) return data.title;
    if ('name' in data && data.name) return data.name;
    if ('query' in data && data.query) return data.query;
    return 'export';
  }

  /**
   * Fetch data based on type and ID from database
   */
  private async fetchData(type: ExportType, id: string): Promise<ExportableData | null> {
    switch (type) {
      case 'brief':
        return this.fetchBriefData(id);
      
      case 'user_profile':
        return this.fetchUserProfileData(id);
      
      case 'search_results':
        // For search results, id would be a query or search session ID
        return this.fetchSearchResultsData(id);
      
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  /**
   * Fetch brief data from database
   */
  private async fetchBriefData(id: string): Promise<BriefExportData | null> {
    try {
      const brief = await db.brief.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          model: true,
          categories: {
            select: {
              name: true
            }
          },
          sources: {
            select: {
              id: true,
              title: true,
              url: true
            }
          },
          references: {
            include: {
              source: {
                select: {
                  title: true,
                  url: true
                }
              }
            }
          },
          reviews: {
            include: {
              author: {
                select: {
                  name: true
                }
              }
            }
          },
          upvotes: true,
          _count: {
            select: {
              viewedBy: true
            }
          }
        }
      });

      if (!brief) {
        return null;
      }

      return {
        id: brief.id,
        title: brief.title,
        abstract: brief.abstract || undefined,
        content: brief.response,
        thinking: brief.thinking || undefined,
        author: {
          id: brief.author.id,
          name: brief.author.name || 'Anonymous',
          email: brief.author.email || undefined
        },
        model: {
          name: brief.model.name,
          provider: brief.model.provider,
          version: brief.model.version
        },
        categories: brief.categories.map(cat => cat.name),
        sources: brief.sources,
        references: brief.references.map(ref => ({
          id: ref.id,
          highlightedText: ref.highlightedText,
          context: ref.context || undefined,
          source: ref.source
        })),
        reviews: brief.reviews.map(review => ({
          id: review.id,
          content: review.content,
          rating: review.rating,
          author: review.author.name || 'Anonymous',
          createdAt: review.createdAt
        })),
        statistics: {
          viewCount: brief._count.viewedBy,
          upvotes: brief.upvotes.length,
          createdAt: brief.createdAt,
          updatedAt: brief.updatedAt,
          readTime: brief.readTime || undefined
        }
      };
    } catch (error) {
      console.error('Error fetching brief data:', error);
      return null;
    }
  }

  /**
   * Fetch user profile data from database
   */
  private async fetchUserProfileData(id: string): Promise<UserProfileExportData | null> {
    try {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          briefs: {
            where: { published: true },
            select: {
              id: true,
              title: true,
              abstract: true,
              createdAt: true,
              viewCount: true,
              upvotes: {
                select: { id: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          reviews: {
            select: { id: true }
          },
          briefUpvotes: {
            select: { id: true }
          },
          tokenBalance: true,
          _count: {
            select: {
              briefs: true,
              reviews: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Calculate upvotes received
      const upvotesReceived = await db.briefUpvote.count({
        where: {
          brief: {
            userId: user.id
          }
        }
      });

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        email: user.email || undefined,
        joinedAt: user.createdAt,
        statistics: {
          briefsCreated: user._count.briefs,
          reviewsWritten: user._count.reviews,
          upvotesReceived,
          tokenBalance: user.tokenBalance?.balance || 0
        },
        briefs: user.briefs.map(brief => ({
          id: brief.id,
          title: brief.title,
          abstract: brief.abstract || undefined,
          createdAt: brief.createdAt,
          viewCount: brief.viewCount,
          upvotes: brief.upvotes.length
        })),
        preferences: {
          emailNotifications: user.emailNotifications,
          briefInterestUpdates: user.briefInterestUpdates,
          promotionalNotifications: user.promotionalNotifications
        }
      };
    } catch (error) {
      console.error('Error fetching user profile data:', error);
      return null;
    }
  }

  /**
   * Fetch search results data (placeholder - would need search implementation)
   */
  private async fetchSearchResultsData(query: string): Promise<SearchResultsExportData | null> {
    // This is a simplified implementation
    // In a real app, you'd have a proper search service
    try {
      const results = await db.brief.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { response: { contains: query } },
            { abstract: { contains: query } }
          ],
          published: true
        },
        include: {
          author: {
            select: { name: true }
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });

      return {
        query,
        filters: {},
        totalResults: results.length,
        results: results.map(brief => ({
          id: brief.id,
          title: brief.title,
          abstract: brief.abstract || undefined,
          author: brief.author.name || 'Anonymous',
          createdAt: brief.createdAt,
          relevanceScore: 0.8 // Placeholder relevance score
        })),
        searchMetadata: {
          executedAt: new Date(),
          executionTime: 150,
          page: 1,
          limit: 50
        }
      };
    } catch (error) {
      console.error('Error fetching search results:', error);
      return null;
    }
  }

  /**
   * Record export in database
   */
  private async recordExport(userId: string, request: ExportRequest, result: ExportGenerationResult): Promise<void> {
    try {
      // Record in ExportHistory table
      const exportHistory = await db.exportHistory.create({
        data: {
          userId,
          exportType: request.type,
          exportFormat: request.format,
          targetId: request.id,
          filename: result.filename,
          fileSize: result.size,
          status: 'completed',
          options: request.options ? JSON.stringify(request.options) : null
        }
      });
      
      // Update or create ExportUsage for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingUsage = await db.exportUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });
      
      if (existingUsage) {
        await db.exportUsage.update({
          where: { id: existingUsage.id },
          data: { count: existingUsage.count + 1 }
        });
      } else {
        await db.exportUsage.create({
          data: {
            userId,
            date: today,
            count: 1
          }
        });
      }
    } catch (error) {
      console.error('💥 Error recording export to database:', error);
      // Don't throw error here as export was successful
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get user's remaining export requests for today
   */
  async getRemainingRequests(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsage = await db.exportUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      const used = todayUsage?.count || 0;
      return Math.max(0, 10 - used);
    } catch (error) {
      console.error('Error getting remaining requests:', error);
      return 10; // Default to full allowance on error
    }
  }

  /**
   * Get user's export history
   */
  async getExportHistory(userId: string, limit: number = 10): Promise<ExportHistoryRecord[]> {
    try {
      const history = await db.exportHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      const formattedHistory: ExportHistoryRecord[] = history.map((record) => ({
        id: record.id,
        type: record.exportType,
        format: record.exportFormat,
        filename: record.filename,
        size: this.formatFileSize(record.fileSize || 0),
        createdAt: record.createdAt.toISOString(),
        status: record.status,
        targetId: record.targetId,
        options: record.options ? JSON.parse(record.options) : undefined
      }));

      return formattedHistory;
    } catch (error) {
      console.error('Error getting export history:', error);
      return [];
    }
  }

  /**
   * Get export usage statistics
   */
  async getExportStats(userId: string): Promise<ExportUsageStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      // Get today's usage
      const todayUsage = await db.exportUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      // Get this month's total
      const monthlyCount = await db.exportHistory.count({
        where: {
          userId,
          createdAt: {
            gte: thisMonth
          }
        }
      });

      // Get total count
      const totalCount = await db.exportHistory.count({
        where: { userId }
      });

      const todayCount = todayUsage?.count || 0;
      const remaining = Math.max(0, 10 - todayCount);

      const stats = {
        today: todayCount,
        thisMonth: monthlyCount,
        total: totalCount,
        remaining
      };

      return stats;
    } catch (error) {
      console.error('Error getting export stats:', error);
      return {
        today: 0,
        thisMonth: 0,
        total: 0,
        remaining: 10
      };
    }
  }

  /**
   * Reset daily export count (for local mode)
   * Note: This only resets the rate limit, not the usage statistics
   */
  async resetDailyExports(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Delete or reset the usage record for today
      await db.exportUsage.deleteMany({
        where: {
          userId,
          date: today
        }
      });
      
    } catch (error) {
      console.error('💥 Error resetting daily exports:', error);
      throw error;
    }
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): ExportFormat[] {
    return ['pdf', 'markdown', 'html', 'json', 'csv', 'docx', 'txt'];
  }

  /**
   * Get available export types
   */
  getAvailableTypes(): ExportType[] {
    return ['brief', 'user_profile', 'search_results'];
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance();
