'use server';

import puppeteer, { Browser, Page } from 'puppeteer';
import { BriefSource } from '../types';
import { ExtractorConfig, ExtractionResult, SelectorTestResult, ValidationResult } from './extractor_types';
import { ExtractionLogger } from './logger';

/**
 * Launch browser with anti-detection measures
 */
export async function launchBrowser(logger: ExtractionLogger): Promise<Browser> {
  logger.info('BROWSER_LAUNCH', 'Launching headless browser...');

  try {
    const browser = await puppeteer.launch({
      headless: 'new' as any,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    logger.info('BROWSER_LAUNCH', 'Browser launched successfully');
    return browser;
  } catch (error) {
    logger.error('BROWSER_LAUNCH', 'Failed to launch browser', { error: error.message });
    throw error;
  }
}

/**
 * Navigate to URL with retry logic
 */
export async function navigateWithRetry(
  browser: Browser,
  url: string,
  timeout: number,
  logger: ExtractionLogger,
  maxRetries: number = 3
): Promise<Page> {
  logger.info('NAVIGATION', `Navigating to ${url}`, { timeout, maxRetries });

  const page = await browser.newPage();

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  logger.debug('NAVIGATION', 'Headers set', {
    userAgent: await page.evaluate(() => navigator.userAgent)
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info('NAVIGATION', `Attempt ${attempt}/${maxRetries}...`);

      const navStart = Date.now();
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout
      });
      const navTime = Date.now() - navStart;

      logger.info('NAVIGATION', `Page loaded successfully in ${navTime}ms`);

      // Get page info
      const title = await page.title();
      const urlAfterNav = page.url();

      logger.debug('NAVIGATION', 'Page info', { title, url: urlAfterNav });

      // Take screenshot
      await logger.saveScreenshot(page, 'after_navigation.png');

      return page;

    } catch (error) {
      lastError = error;
      logger.warn('NAVIGATION', `Attempt ${attempt} failed`, {
        error: error.message,
        willRetry: attempt < maxRetries
      });

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.debug('NAVIGATION', `Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('NAVIGATION', 'All navigation attempts failed', { error: lastError?.message });
  throw lastError || new Error('Navigation failed');
}

/**
 * Close modals and popups
 */
export async function closeModals(
  page: Page,
  selectors: string[],
  logger: ExtractionLogger
): Promise<number> {
  logger.info('MODAL_CLOSE', `Attempting to close modals...`, { selectors });

  let closedCount = 0;

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);

      if (elements.length > 0) {
        logger.debug('MODAL_CLOSE', `Found ${elements.length} elements matching: ${selector}`);

        for (const element of elements) {
          try {
            await element.click();
            closedCount++;
            logger.info('MODAL_CLOSE', `Clicked element: ${selector}`);
            await page.waitForTimeout(1000);
          } catch (e) {
            logger.debug('MODAL_CLOSE', `Could not click element: ${selector}`, { error: e.message });
          }
        }
      }
    } catch (error) {
      logger.debug('MODAL_CLOSE', `Error with selector: ${selector}`, { error: error.message });
    }
  }

  logger.info('MODAL_CLOSE', `Closed ${closedCount} modals`);

  if (closedCount > 0) {
    await logger.saveScreenshot(page, 'after_modal_close.png');
  }

  return closedCount;
}

/**
 * Wait for content to appear on page
 */
export async function waitForContent(
  page: Page,
  selectors: string[],
  timeout: number,
  logger: ExtractionLogger
): Promise<SelectorTestResult[]> {
  logger.info('WAIT_CONTENT', `Waiting for content selectors...`, { selectors, timeout });

  const results: SelectorTestResult[] = [];

  for (const selector of selectors) {
    try {
      logger.debug('WAIT_CONTENT', `Testing selector: ${selector}`);

      await page.waitForSelector(selector, { timeout: timeout });

      const count = await page.$$eval(selector, els => els.length);
      const textPreview = await page.$eval(selector, el =>
        el.textContent?.substring(0, 100) || ''
      );

      results.push({
        selector,
        found: true,
        count,
        textPreview
      });

      logger.info('WAIT_CONTENT', `✓ Found content with: ${selector}`, { count, textPreview });
      break; // Found content, stop trying

    } catch (error) {
      results.push({
        selector,
        found: false
      });

      logger.debug('WAIT_CONTENT', `✗ Not found: ${selector}`);
    }
  }

  const foundAny = results.some(r => r.found);

  if (!foundAny) {
    logger.warn('WAIT_CONTENT', 'No content selectors matched');
  }

  return results;
}

/**
 * Test content selectors and return what was found
 */
export async function testContentSelectors(
  page: Page,
  selectors: string[],
  logger: ExtractionLogger
): Promise<SelectorTestResult[]> {
  logger.info('TEST_SELECTORS', `Testing ${selectors.length} content selectors...`);

  const results: SelectorTestResult[] = [];

  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);

      if (elements.length > 0) {
        const textPreview = await page.$eval(selector, el =>
          el.textContent?.substring(0, 150) || ''
        );

        results.push({
          selector,
          found: true,
          count: elements.length,
          textPreview
        });

        logger.info('TEST_SELECTORS', `✓ ${selector}`, {
          count: elements.length,
          preview: textPreview.substring(0, 50) + '...'
        });
      } else {
        results.push({
          selector,
          found: false
        });
        logger.debug('TEST_SELECTORS', `✗ ${selector} - not found`);
      }
    } catch (error) {
      results.push({
        selector,
        found: false
      });
      logger.debug('TEST_SELECTORS', `✗ ${selector} - error`, { error: error.message });
    }
  }

  const foundCount = results.filter(r => r.found).length;
  logger.info('TEST_SELECTORS', `Found ${foundCount}/${selectors.length} selectors`);

  return results;
}

/**
 * Extract main content using selectors
 */
export async function extractContent(
  page: Page,
  selectors: string[],
  logger: ExtractionLogger
): Promise<{ content: string; selectorUsed: string | null }> {
  logger.info('EXTRACT_CONTENT', 'Extracting main content...');

  for (const selector of selectors) {
    try {
      const element = await page.$(selector);

      if (element) {
        const content = await page.$eval(selector, el => el.textContent || '');

        if (content && content.length > 50) {
          logger.info('EXTRACT_CONTENT', `✓ Extracted ${content.length} chars using: ${selector}`);
          return { content: content.trim(), selectorUsed: selector };
        } else {
          logger.debug('EXTRACT_CONTENT', `Content too short from: ${selector}`, { length: content.length });
        }
      }
    } catch (error) {
      logger.debug('EXTRACT_CONTENT', `Failed with selector: ${selector}`, { error: error.message });
    }
  }

  logger.warn('EXTRACT_CONTENT', 'No content selectors succeeded, trying fallback');

  // Fallback: get body text
  try {
    const bodyText = await page.$eval('body', el => el.textContent || '');
    logger.warn('EXTRACT_CONTENT', `Using body fallback: ${bodyText.length} chars`);
    return { content: bodyText.trim(), selectorUsed: 'body (fallback)' };
  } catch (error) {
    logger.error('EXTRACT_CONTENT', 'All extraction methods failed');
    return { content: '', selectorUsed: null };
  }
}

/**
 * Extract sources/links from page
 */
export async function extractSources(
  page: Page,
  logger: ExtractionLogger
): Promise<BriefSource[]> {
  logger.info('EXTRACT_SOURCES', 'Extracting source links...');

  try {
    const sources = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="http"]'));
      const seen = new Set<string>();
      const sources: BriefSource[] = [];

      for (const link of links) {
        const url = link.getAttribute('href');
        const text = link.textContent?.trim() || '';

        if (url && !seen.has(url)) {
          seen.add(url);

          // Filter out common non-source links
          if (!url.includes('facebook.com') &&
              !url.includes('twitter.com') &&
              !url.includes('linkedin.com') &&
              !url.includes('instagram.com')) {
            sources.push({
              title: text || url,
              url: url
            });
          }
        }
      }

      return sources;
    });

    logger.info('EXTRACT_SOURCES', `Found ${sources.length} unique source URLs`);

    if (sources.length > 0) {
      logger.debug('EXTRACT_SOURCES', 'Sample sources', {
        first3: sources.slice(0, 3).map(s => ({ title: s.title, url: s.url }))
      });
    }

    return sources;

  } catch (error) {
    logger.error('EXTRACT_SOURCES', 'Failed to extract sources', { error: error.message });
    return [];
  }
}

/**
 * Validate extraction results
 */
export function validateExtraction(
  title: string,
  content: string,
  abstract: string,
  sources: BriefSource[],
  logger: ExtractionLogger
): ValidationResult {
  logger.info('VALIDATION', 'Validating extraction quality...');

  const issues = {
    missingTitle: !title || title.length < 5,
    shortContent: !content || content.length < 100,
    noSources: sources.length === 0,
    noAbstract: !abstract || abstract.length < 10
  };

  const warnings: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'high';

  if (issues.missingTitle) {
    warnings.push('Title is missing or too short');
    confidence = 'low';
  }

  if (issues.shortContent) {
    warnings.push('Content is too short - extraction may have failed');
    confidence = 'low';
  } else if (content.length < 500) {
    warnings.push('Content seems short - extraction may be incomplete');
    if (confidence !== 'low') confidence = 'medium';
  }

  if (issues.noSources) {
    warnings.push('No sources found');
    if (confidence !== 'low') confidence = 'medium';
  }

  if (issues.noAbstract) {
    warnings.push('No abstract/conclusion found');
    // Don't downgrade confidence for this
  }

  logger.info('VALIDATION', `Confidence: ${confidence}`, {
    titleLength: title.length,
    contentLength: content.length,
    sourcesCount: sources.length,
    abstractLength: abstract.length,
    warnings
  });

  return { confidence, warnings, issues };
}
