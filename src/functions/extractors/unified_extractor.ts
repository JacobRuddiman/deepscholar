'use server';

import { BriefSource } from '../types';
import { ExtractorConfig, ExtractionResult } from './extractor_types';
import { ExtractionLogger } from './logger';
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

/**
 * Unified extraction function with comprehensive logging
 */
export async function extractWithLogging(
  url: string,
  config: ExtractorConfig
): Promise<ExtractionResult> {
  const logger = new ExtractionLogger(config.platformName, url);
  const overallStart = Date.now();

  logger.info('START', `Starting extraction for ${config.platformName}`, { url, config: config.platformName });

  let browser;
  let page;

  try {
    // Step 1: Launch browser
    const browserStart = Date.now();
    browser = await launchBrowser(logger);
    const browserTime = Date.now() - browserStart;

    // Step 2: Navigate to URL
    const navStart = Date.now();
    page = await navigateWithRetry(browser, url, config.navigationTimeout, logger);
    const navigationTime = Date.now() - navStart;

    // Wait a bit for JS to load
    logger.info('WAIT', 'Waiting for JavaScript to load...');
    await page.waitForTimeout(3000);

    // Step 3: Save initial HTML
    const initialHtml = await page.content();
    await logger.saveHTML(initialHtml, 'initial_page.html');

    // Step 4: Check for Cloudflare or other challenges
    const bodyText = await page.$eval('body', el => el.textContent || '');
    if (bodyText.includes('Verify you are human') || bodyText.includes('cloudflare')) {
      logger.warn('CLOUDFLARE', 'Detected Cloudflare challenge');
      await logger.saveScreenshot(page, 'cloudflare_detected.png');

      // Wait longer for potential bypass
      logger.info('CLOUDFLARE', 'Waiting 30s for challenge to complete...');
      await page.waitForTimeout(30000);
    }

    // Check for private/auth requirements
    if (bodyText.includes('private') || bodyText.includes('Sign in') || bodyText.includes('login')) {
      logger.warn('AUTH', 'Detected auth requirement or private content');
      await logger.saveScreenshot(page, 'auth_detected.png');
    }

    // Step 5: Close modals
    const modalCount = await closeModals(page, config.modalCloseSelectors, logger);

    // Step 6: Wait for content selectors
    const waitResults = await waitForContent(page, config.waitForSelectors, config.contentWaitTimeout, logger);

    // Step 7: Test all content selectors
    const selectorResults = await testContentSelectors(page, config.contentSelectors, logger);

    // Step 8: Save HTML after modals closed
    const contentHtml = await page.content();
    await logger.saveHTML(contentHtml, 'after_modal_close.html');
    await logger.saveScreenshot(page, 'before_extraction.png');

    // Step 9: Extract title
    logger.info('EXTRACT_TITLE', 'Extracting page title...');
    const title = await page.title();
    logger.info('EXTRACT_TITLE', `Title: ${title}`);

    // Step 10: Extract main content
    const extractStart = Date.now();
    const { content: rawContent, selectorUsed } = await extractContent(page, config.contentSelectors, logger);

    // Step 11: Parse sections from content
    logger.info('PARSE_SECTIONS', 'Parsing content sections...');
    const { mainContent, abstract, references } = await page.evaluate((rawContent, abstractPatterns, referencesPatterns) => {
      let main = rawContent;
      let abstractSection = '';
      let referencesSection = '';

      // Find abstract
      for (const pattern of abstractPatterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const match = rawContent.match(regex);

        if (match && match.index !== undefined) {
          const startIndex = match.index;

          // Find where abstract ends (next section or end)
          let endIndex = rawContent.length;

          for (const refPattern of referencesPatterns) {
            const refRegex = new RegExp(refPattern.source, refPattern.flags);
            const refMatch = rawContent.substring(startIndex + 100).match(refRegex);

            if (refMatch && refMatch.index !== undefined) {
              endIndex = startIndex + 100 + refMatch.index;
              break;
            }
          }

          abstractSection = rawContent.substring(startIndex, endIndex).trim();
          main = rawContent.substring(0, startIndex).trim();
          break;
        }
      }

      // Find references
      for (const pattern of referencesPatterns) {
        const regex = new RegExp(pattern.source, pattern.flags);
        const match = rawContent.match(regex);

        if (match && match.index !== undefined) {
          referencesSection = rawContent.substring(match.index).trim();
          if (!abstractSection) {
            main = rawContent.substring(0, match.index).trim();
          }
          break;
        }
      }

      return {
        mainContent: main,
        abstract: abstractSection,
        references: referencesSection
      };
    }, rawContent, config.abstractPatterns.map(p => ({ source: p.source, flags: p.flags })), config.referencesPatterns.map(p => ({ source: p.source, flags: p.flags })));

    logger.info('PARSE_SECTIONS', 'Sections parsed', {
      mainContentLength: mainContent.length,
      abstractLength: abstract.length,
      referencesLength: references.length
    });

    // Step 12: Extract sources
    const sources = await extractSources(page, logger);

    const extractionTime = Date.now() - extractStart;

    // Step 13: Get final HTML for rawHtml field
    const finalHtml = await page.content();

    // Step 14: Validate
    const validation = validateExtraction(title, mainContent, abstract, sources, logger);

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
      content: mainContent,
      abstract,
      sources,
      thinking: '',
      prompt: '',  // Will be populated later if found
      model: config.platformName as any,
      rawHtml: finalHtml,
      references,
      confidence: validation.confidence,
      warnings: validation.warnings,
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
    logger.error('FATAL', 'Extraction failed with error', {
      error: error.message,
      stack: error.stack
    });

    // Try to save screenshot if page exists
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
