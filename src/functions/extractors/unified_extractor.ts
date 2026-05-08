'use server';

import { BriefSource, ConversationTurn } from '../types';
import { ExtractorConfig, ExtractionResult, SelectorTestResult } from './extractor_types';
import { ExtractionLogger } from './logger';
import { mapPlatformToModel } from '@/lib/extraction/platform';
import {
  launchBrowser,
  navigateWithRetry,
  closeModals,
  waitForContent,
  testContentSelectors,
  extractContent,
  extractSources,
  validateExtraction
} from './base_extractor';
import { detectConversationTurns } from './conversation_detector';

/**
 * Unified extraction function with comprehensive logging
 */
export async function extractWithLogging(
  url: string,
  config: ExtractorConfig
): Promise<ExtractionResult> {
  const logger = new ExtractionLogger(config.platformName, url);
  const overallStart = Date.now();
  const debugMode = config.debugMode ?? false;

  logger.info('START', `Starting extraction for ${config.platformName}`, { url, config: config.platformName });

  let browser;
  let page;

  try {
    // Step 1: Launch browser
    const browserStart = Date.now();
    const headless = config.headless ?? true;
    browser = await launchBrowser(logger, headless);
    const browserTime = Date.now() - browserStart;

    // Step 2: Navigate to URL
    const navStart = Date.now();
    page = await navigateWithRetry(browser, url, config.navigationTimeout, logger, 3, debugMode);
    const navigationTime = Date.now() - navStart;

    // Wait a bit for JS to load (reduced from 3s to 1s for performance)
    logger.info('WAIT', 'Waiting for JavaScript to load...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Save initial HTML (only in debug mode)
    if (debugMode) {
      const initialHtml = await page.content();
      await logger.saveHTML(initialHtml, 'initial_page.html');
    }

    // Step 4: Check for Cloudflare or other challenges
    const bodyText = await page.$eval('body', el => el.textContent || '');
    if (bodyText.includes('Verify you are human') || bodyText.includes('cloudflare')) {
      logger.warn('CLOUDFLARE', 'Detected Cloudflare challenge');
      if (debugMode) {
        await logger.saveScreenshot(page, 'cloudflare_detected.png');
      }

      // Wait longer for potential bypass
      logger.info('CLOUDFLARE', 'Waiting 30s for challenge to complete...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    // Check for private/auth requirements
    if (bodyText.includes('private') || bodyText.includes('Sign in') || bodyText.includes('login')) {
      logger.warn('AUTH', 'Detected auth requirement or private content');
      if (debugMode) {
        await logger.saveScreenshot(page, 'auth_detected.png');
      }
    }

    // Step 5: Wait for content selectors first (more efficient to check before closing modals)
    const waitResults = await waitForContent(page, config.waitForSelectors, config.contentWaitTimeout, logger);

    // Step 6: Close modals only if content wasn't immediately found
    const contentFound = waitResults.some(r => r.found);
    let modalCount = 0;
    if (!contentFound) {
      modalCount = await closeModals(page, config.modalCloseSelectors, logger, debugMode);
      // Re-wait for content after closing modals
      if (modalCount > 0) {
        await waitForContent(page, config.waitForSelectors, config.contentWaitTimeout, logger);
      }
    }

    // Step 7: Test all content selectors (only in debug mode - expensive operation)
    let selectorResults: SelectorTestResult[] = [];
    if (debugMode) {
      selectorResults = await testContentSelectors(page, config.contentSelectors, logger);
    }

    // Step 8: Save HTML and screenshots (only in debug mode)
    if (debugMode) {
      const contentHtml = await page.content();
      await logger.saveHTML(contentHtml, 'after_modal_close.html');
      await logger.saveScreenshot(page, 'before_extraction.png');
    }

    // Step 9: Extract title
    logger.info('EXTRACT_TITLE', 'Extracting page title...');
    const title = await page.title();
    logger.info('EXTRACT_TITLE', `Title: ${title}`);

    // Step 10: Extract main content
    const extractStart = Date.now();
    const { content: rawContent, selectorUsed } = await extractContent(page, config.contentSelectors, logger);

    // Step 11: Skip section parsing - let content_parser handle it
    // The extractor's job is just to get ALL the content, the parser will separate sections properly
    logger.info('PARSE_SECTIONS', 'Skipping extractor-level section parsing (content_parser will handle it)');

    const mainContent = rawContent;
    const abstract = '';
    const references = '';

    logger.info('PARSE_SECTIONS', 'Full content extracted', {
      totalContentLength: mainContent.length
    });

    // Step 12: Extract sources
    const sources = await extractSources(page, logger);

    const extractionTime = Date.now() - extractStart;

    // Step 12.5: Detect conversation turns
    logger.info('CONVERSATION', 'Detecting conversation turns...');
    let conversationTurns: ConversationTurn[] = [];
    try {
      conversationTurns = await detectConversationTurns(page, config.platformName);
      if (conversationTurns.length > 0) {
        logger.info('CONVERSATION', `Detected ${conversationTurns.length} conversation turn(s)`, {
          turns: conversationTurns.map(t => ({
            index: t.index,
            promptLength: t.userMessage.length,
            responseLength: t.assistantMessage.length
          }))
        });
      } else {
        logger.info('CONVERSATION', 'No conversation turns detected (single-turn or non-conversational content)');
      }
    } catch (error) {
      const convMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('CONVERSATION', 'Error detecting conversation turns', { error: convMessage });
      conversationTurns = [];
    }

    // Step 13: Get final HTML for rawHtml field
    const finalHtml = await page.content();

    // Step 14: Validate
    const validation = await validateExtraction(title, mainContent, abstract, sources, logger);

    const totalTime = Date.now() - overallStart;

    logger.info('COMPLETE', `Extraction completed in ${(totalTime / 1000).toFixed(2)}s`, {
      confidence: validation.confidence,
      warnings: validation.warnings.length
    });

    // Save logs
    await logger.saveLogs();

    // Close browser
    await browser.close();

    return {
      title,
      response: mainContent,
      abstract,
      sources,
      thinking: '',
      prompt: '',  // Will be populated later if found
      model: mapPlatformToModel(config.platformName),
      rawHtml: finalHtml,
      references,
      confidence: validation.confidence,
      warnings: validation.warnings,
      conversationTurns: conversationTurns.length > 0 ? conversationTurns : undefined,
      diagnostics: {
        selectorsTestedForContent: selectorResults,
        selectorsTestedForWait: waitResults,
        modalsClosed: modalCount,
        navigationTime,
        extractionTime,
        totalTime
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('FATAL', 'Extraction failed with error', {
      error: message,
      stack
    });

    // Try to save screenshot if page exists (only in debug mode)
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
