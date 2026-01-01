'use server';

import puppeteer from 'puppeteer';
import { BriefData, BriefSource } from '../types';
import { ExtractionLogger } from './logger';
import {
  launchBrowser,
  navigateWithRetry,
  extractSources,
  validateExtraction
} from './base_extractor';

/**
 * Google Docs extractor for Gemini outputs
 * Handles public Google Docs links that Gemini creates
 */
export async function extractFromGoogleDocs(url: string): Promise<BriefData> {
  const logger = new ExtractionLogger('google-docs', url);
  const overallStart = Date.now();

  logger.info('START', 'Starting Google Docs extraction', { url });

  let browser;
  let page;

  try {
    // Step 1: Launch browser
    browser = await launchBrowser(logger);

    // Step 2: Convert to export URL for easier text extraction
    const docId = extractDocId(url);
    if (!docId) {
      throw new Error('Could not extract document ID from URL');
    }

    logger.info('DOC_ID', `Extracted document ID: ${docId}`);

    // Try the standard view URL first
    const viewUrl = `https://docs.google.com/document/d/${docId}/edit`;
    logger.info('NAVIGATION', `Navigating to: ${viewUrl}`);

    // Step 3: Navigate
    const navStart = Date.now();
    page = await navigateWithRetry(browser, viewUrl, 30000, logger);
    const navigationTime = Date.now() - navStart;

    // Wait for content to load
    logger.info('WAIT', 'Waiting for document content...');
    await page.waitForTimeout(3000);

    // Save initial state
    const initialHtml = await page.content();
    await logger.saveHTML(initialHtml, 'initial_page.html');
    await logger.saveScreenshot(page, 'after_navigation.png');

    // Step 4: Extract content using Google Docs specific selectors
    logger.info('EXTRACT', 'Extracting document content...');

    const extractStart = Date.now();

    // Get the title
    const title = await page.evaluate(() => {
      // Try to get title from the document
      const titleElement = document.querySelector('.docs-title-input-label-inner') ||
                          document.querySelector('[role="heading"]') ||
                          document.querySelector('title');
      return titleElement?.textContent?.trim() || 'Untitled Document';
    });

    logger.info('EXTRACT_TITLE', `Title: ${title}`);

    // Get the main content
    const content = await page.evaluate(() => {
      // Google Docs renders content in a canvas-based editor
      // We need to extract from the text layer
      const contentSelectors = [
        '.kix-paginateddocumentplugin',  // Main document container
        '.kix-page',                      // Individual pages
        '[role="document"]',
        '.doc-content',
        'body'
      ];

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Get all text nodes
          const textContent = element.textContent || '';
          if (textContent.length > 100) {
            return textContent.trim();
          }
        }
      }

      return '';
    });

    logger.info('EXTRACT_CONTENT', `Extracted ${content.length} characters`);

    // Try to parse sections
    logger.info('PARSE_SECTIONS', 'Parsing content sections...');

    let mainContent = content;
    let abstract = '';
    let references = '';

    // Look for common section patterns
    const abstractPatterns = [
      /\n\s*(?:Conclusion|Summary|Abstract|Key Takeaways|In Conclusion)\s*\n([\s\S]+?)(?=\n\s*(?:References|Sources|Citations|$))/i,
      /\n\s*(?:Conclusion|Summary)\s*[:]\s*([\s\S]+?)$/i
    ];

    const referencesPatterns = [
      /\n\s*(?:References|Sources|Citations|Bibliography)\s*[:]\s*([\s\S]+?)$/i,
      /\n\s*(?:References|Sources)\s*\n([\s\S]+?)$/i
    ];

    // Extract abstract
    for (const pattern of abstractPatterns) {
      const match = content.match(pattern);
      if (match) {
        abstract = match[1]?.trim() || match[0]?.trim() || '';
        logger.info('PARSE_SECTIONS', `Found abstract: ${abstract.length} chars`);
        break;
      }
    }

    // Extract references
    for (const pattern of referencesPatterns) {
      const match = content.match(pattern);
      if (match) {
        references = match[1]?.trim() || match[0]?.trim() || '';
        logger.info('PARSE_SECTIONS', `Found references: ${references.length} chars`);

        // Remove references from main content
        if (references) {
          const refIndex = content.lastIndexOf(references);
          if (refIndex > 0) {
            mainContent = content.substring(0, refIndex).trim();
          }
        }
        break;
      }
    }

    // Remove abstract from main content if found
    if (abstract && abstract.length > 0) {
      const abstractIndex = mainContent.lastIndexOf(abstract);
      if (abstractIndex > 0) {
        mainContent = mainContent.substring(0, abstractIndex).trim();
      }
    }

    logger.info('PARSE_SECTIONS', 'Sections parsed', {
      mainContentLength: mainContent.length,
      abstractLength: abstract.length,
      referencesLength: references.length
    });

    // Step 5: Extract sources from content
    const sources = extractSourcesFromText(content, logger);

    const extractionTime = Date.now() - extractStart;

    // Step 6: Get raw HTML
    const finalHtml = await page.content();

    // Step 7: Validate
    const validation = validateExtraction(title, mainContent, abstract, sources, logger);

    const totalTime = Date.now() - overallStart;

    logger.info('COMPLETE', `Extraction completed in ${(totalTime / 1000).toFixed(2)}s`, {
      confidence: validation.confidence,
      warnings: validation.warnings.length
    });

    // Save logs
    await logger.saveLogs();
    await browser.close();

    return {
      title,
      content: mainContent,
      abstract,
      sources,
      thinking: '',
      prompt: '',
      model: 'other',
      rawHtml: finalHtml,
      references,
      confidence: validation.confidence,
      warnings: validation.warnings
    };

  } catch (error) {
    logger.error('FATAL', 'Extraction failed', {
      error: error.message,
      stack: error.stack
    });

    if (page) {
      try {
        await logger.saveScreenshot(page, 'error_state.png');
        const errorHtml = await page.content();
        await logger.saveHTML(errorHtml, 'error_state.html');
      } catch (e) {
        logger.error('FATAL', 'Could not save error state', { error: e.message });
      }
    }

    await logger.saveLogs();

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

/**
 * Extract document ID from Google Docs URL
 */
function extractDocId(url: string): string | null {
  // Match patterns like:
  // https://docs.google.com/document/d/DOCUMENT_ID/edit
  // https://docs.google.com/document/d/DOCUMENT_ID/view
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract source URLs from text content
 */
function extractSourcesFromText(text: string, logger: ExtractionLogger): BriefSource[] {
  logger.info('EXTRACT_SOURCES', 'Extracting URLs from text...');

  const sources: BriefSource[] = [];
  const seen = new Set<string>();

  // Match URLs in text
  const urlRegex = /https?:\/\/[^\s<>"'\)]+/g;
  const matches = text.matchAll(urlRegex);

  for (const match of matches) {
    const url = match[0];

    // Clean up URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

    // Skip Google Docs URLs
    if (cleanUrl.includes('docs.google.com') || cleanUrl.includes('drive.google.com')) {
      continue;
    }

    if (!seen.has(cleanUrl)) {
      seen.add(cleanUrl);
      sources.push({
        title: extractDomainName(cleanUrl),
        url: cleanUrl
      });
    }
  }

  logger.info('EXTRACT_SOURCES', `Found ${sources.length} unique URLs`);

  return sources;
}

/**
 * Extract domain name from URL for display
 */
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
