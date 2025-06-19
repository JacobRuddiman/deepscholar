/**
 * Export Types and Interfaces
 * 
 * Defines all TypeScript types and interfaces used throughout the export system
 */

// Base export request interface
export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  id: string;
  options?: ExportOptions;
  metadata?: ExportMetadata;
}

// Export response interface
export interface ExportResponse {
  success: boolean;
  data?: ExportData;
  error?: string;
  downloadUrl?: string;
  filename?: string;
  size?: number;
  generatedAt: Date;
}

// Export formats
export type ExportFormat = 
  | 'pdf'
  | 'markdown' 
  | 'html'
  | 'json'
  | 'csv'
  | 'docx'
  | 'txt';

// Export types
export type ExportType = 
  | 'brief'
  | 'user_profile'
  | 'search_results'
  | 'category'
  | 'collection'
  | 'analytics';

// Export options for customization
export interface ExportOptions {
  includeMetadata?: boolean;
  includeReferences?: boolean;
  includeComments?: boolean;
  includeVersionHistory?: boolean;
  template?: string;
  styling?: ExportStyling;
  compression?: boolean;
  watermark?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

// Export styling options
export interface ExportStyling {
  theme?: 'light' | 'dark' | 'academic' | 'minimal';
  fontSize?: number;
  fontFamily?: string;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerFooter?: boolean;
  pageNumbers?: boolean;
}

// Export metadata
export interface ExportMetadata {
  title?: string;
  author?: string;
  description?: string;
  keywords?: string[];
  createdBy: string;
  exportedAt: Date;
  version?: string;
  source?: string;
}

// Export data container
export interface ExportData {
  content: string | Buffer;
  mimeType: string;
  encoding?: string;
  headers?: Record<string, string>;
}

// Brief export specific types
export interface BriefExportData {
  id: string;
  title: string;
  abstract?: string;
  content: string;
  thinking?: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  model: {
    name: string;
    provider: string;
    version: string;
  };
  categories: string[];
  sources: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  references: Array<{
    id: string;
    highlightedText: string;
    context?: string;
    source: {
      title: string;
      url: string;
    };
  }>;
  reviews?: Array<{
    id: string;
    content: string;
    rating: number;
    author: string;
    createdAt: Date;
  }>;
  statistics: {
    viewCount: number;
    upvotes: number;
    createdAt: Date;
    updatedAt: Date;
    readTime?: number;
  };
  versions?: Array<{
    id: string;
    versionNumber: number;
    changeLog?: string;
    createdAt: Date;
  }>;
}

// User profile export specific types
export interface UserProfileExportData {
  id: string;
  name: string;
  email?: string;
  image?: string;
  bio?: string;
  joinedAt: Date;
  statistics: {
    briefsCreated: number;
    reviewsWritten: number;
    upvotesReceived: number;
    tokenBalance: number;
  };
  briefs: Array<{
    id: string;
    title: string;
    abstract?: string;
    createdAt: Date;
    viewCount: number;
    upvotes: number;
  }>;
  preferences: {
    emailNotifications: boolean;
    briefInterestUpdates: boolean;
    promotionalNotifications: boolean;
  };
}

// Search results export specific types
export interface SearchResultsExportData {
  query: string;
  filters: Record<string, any>;
  totalResults: number;
  results: Array<{
    id: string;
    title: string;
    abstract?: string;
    author: string;
    createdAt: Date;
    relevanceScore?: number;
  }>;
  searchMetadata: {
    executedAt: Date;
    executionTime: number;
    page: number;
    limit: number;
  };
}

// API export specific types
export interface ApiExportRequest {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic';
    credentials: string;
  };
}

// Export job for async processing
export interface ExportJob {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  resultUrl?: string;
  expiresAt?: Date;
}

// Export template interface
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  template: string;
  variables: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

// Export analytics
export interface ExportAnalytics {
  totalExports: number;
  exportsByFormat: Record<ExportFormat, number>;
  exportsByType: Record<ExportType, number>;
  popularFormats: Array<{
    format: ExportFormat;
    count: number;
    percentage: number;
  }>;
  averageFileSize: number;
  totalDataExported: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}
