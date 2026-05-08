import { BriefData, BriefSource } from '../types';

export interface ExtractorConfig {
  platformName: string;

  // Selectors for finding content (priority ordered)
  contentSelectors: string[];

  // Patterns to identify sections
  abstractPatterns: RegExp[];
  referencesPatterns: RegExp[];
  promptPatterns?: RegExp[];

  // Modal/popup handling
  modalCloseSelectors: string[];

  // Elements to wait for before extraction
  waitForSelectors: string[];

  // Timeout settings
  navigationTimeout: number;
  contentWaitTimeout: number;

  // Platform-specific flags
  requiresCloudflareBypass?: boolean;
  requiresAuth?: boolean;

  // Performance flags
  debugMode?: boolean; // Enable screenshots, HTML saves, and verbose logging
  headless?: boolean;  // Launch browser in headless mode (default: true)
}

export interface SelectorTestResult {
  selector: string;
  found: boolean;
  count?: number;
  textPreview?: string;
}

export interface ExtractionResult extends BriefData {
  // Quality metrics
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];

  // Diagnostic info
  diagnostics: {
    selectorsTestedForContent: SelectorTestResult[];
    selectorsTestedForWait: SelectorTestResult[];
    modalsClosed: number;
    navigationTime: number;
    extractionTime: number;
    totalTime: number;
  };
}

export interface ValidationResult {
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  issues: {
    missingTitle: boolean;
    shortContent: boolean;
    noSources: boolean;
    noAbstract: boolean;
  };
}
