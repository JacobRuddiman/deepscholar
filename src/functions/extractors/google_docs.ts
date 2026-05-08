'use server';

import { BriefData, BriefSource, ConversationTurn } from '../types';
import { ExtractionLogger } from './logger';
import {
  launchBrowser,
  navigateWithRetry,
  validateExtraction
} from './base_extractor';
import { detectConversationTurns } from './conversation_detector';
import { extractGoogleDocId } from '@/lib/extraction/platform';

/**
 * Google Docs extractor for Gemini outputs
 * Handles public Google Docs links that Gemini creates
 */
export async function extractFromGoogleDocs(url: string, debugMode: boolean = false): Promise<BriefData> {
  const logger = new ExtractionLogger('google-docs', url);
  const overallStart = Date.now();

  logger.info('START', 'Starting Google Docs extraction', { url });

  let browser;
  let page;

  try {
    // Step 1: Launch browser
    browser = await launchBrowser(logger);

    // Step 2: Resolve document ID for export/view URL generation
    const docId = extractGoogleDocId(url);
    if (!docId) {
      throw new Error('Could not extract document ID from URL');
    }

    logger.info('DOC_ID', `Extracted document ID: ${docId}`);

    // Try the standard view URL first
    const viewUrl = `https://docs.google.com/document/d/${docId}/edit`;
    logger.info('NAVIGATION', `Navigating to: ${viewUrl}`);

    // Step 3: Navigate
    const navStart = Date.now();
    page = await navigateWithRetry(browser, viewUrl, 30000, logger, 3, debugMode);
    const navigationTime = Date.now() - navStart;

    // Wait for content to load (reduced from 3s to 1s for performance)
    logger.info('WAIT', 'Waiting for document content...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save initial state (only in debug mode)
    if (debugMode) {
      const initialHtml = await page.content();
      await logger.saveHTML(initialHtml, 'initial_page.html');
      await logger.saveScreenshot(page, 'after_navigation.png');
    }

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

    // Step 5: Extract sources from content
    const sources = extractSourcesFromText(content, logger);

    const extractionTime = Date.now() - extractStart;

    // Step 6: Get raw HTML
    const finalHtml = await page.content();

    // Step 7: Validate
    const validation = await validateExtraction(title, content, '', sources, logger);

    const totalTime = Date.now() - overallStart;

    logger.info('COMPLETE', `Extraction completed in ${(totalTime / 1000).toFixed(2)}s`, {
      confidence: validation.confidence,
      warnings: validation.warnings.length
    });

    // Detect conversation turns
    logger.info('CONVERSATION', 'Detecting conversation turns...');
    let conversationTurns: ConversationTurn[] = [];
    try {
      conversationTurns = await detectConversationTurns(page, 'google-docs');
      if (conversationTurns.length > 0) {
        logger.info('CONVERSATION', `Detected ${conversationTurns.length} conversation turn(s)`);
      }
    } catch (error) {
      const convMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('CONVERSATION', 'Error detecting conversation turns', { error: convMessage });
    }

    // Save logs
    await logger.saveLogs();
    await browser.close();

    return {
      title,
      response: content,
      abstract: '',
      sources,
      thinking: '',
      prompt: '',
      model: 'other',
      rawHtml: finalHtml,
      references: '',
      confidence: validation.confidence,
      warnings: validation.warnings,
      conversationTurns: conversationTurns.length > 0 ? conversationTurns : undefined
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('FATAL', 'Extraction failed', {
      error: message,
      stack
    });

    if (page && debugMode) {
      try {
        await logger.saveScreenshot(page, 'error_state.png');
        const errorHtml = await page.content();
        await logger.saveHTML(errorHtml, 'error_state.html');
      } catch (e) {
        const eMessage = e instanceof Error ? e.message : 'Unknown error';
        logger.error('FATAL', 'Could not save error state', { error: eMessage });
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
