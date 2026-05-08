'use server';

import { BriefData, BriefSource, ConversationTurn } from '../types';
import { ExtractionLogger } from './logger';
import { launchBrowser, navigateWithRetry, validateExtraction } from './base_extractor';

/** Shape of data returned from browser-side extraction */
type DomExtractResult = {
  prompts: string[];
  blocks: Array<{
    sections: Array<{ heading: string; text: string }>;
    fullCleanText: string;
  }>;
  sources: Array<{ title: string; url: string }>;
  pageTitle: string;
  turns: Array<{ index: number; userMessage: string; assistantMessage: string }>;
};

/**
 * Browser-side extraction function as a plain JS string.
 * This MUST be a string (not a TS function) to avoid tsx/esbuild injecting
 * `__name()` decorators that don't exist in the Puppeteer browser context.
 */
const BROWSER_EXTRACT_FN = `function() {
  function collectSiblingsBetween(start, stopTag) {
    var siblings = [];
    var el = start.nextElementSibling;
    while (el && el.tagName.toLowerCase() !== stopTag.toLowerCase()) {
      siblings.push(el);
      el = el.nextElementSibling;
    }
    return siblings;
  }

  function getCleanText(element) {
    var clone = element.cloneNode(true);
    clone.querySelectorAll('span.citation, span.citation-inline, [class*="citation"]').forEach(
      function(el) { el.remove(); }
    );
    clone.querySelectorAll('sup').forEach(function(el) {
      var text = (el.textContent || '').trim();
      if (/^\\[?\\d+\\]?$/.test(text)) {
        el.remove();
      }
    });
    return (clone.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  // 1. Extract prompts (user queries)
  var queryElements = Array.from(document.querySelectorAll('span.select-text'));
  var prompts = queryElements
    .map(function(el) { return (el.textContent || '').trim(); })
    .filter(function(t) { return t.length > 0; });

  // 2. Extract structured content from each markdown-content block
  var contentBlocks = Array.from(document.querySelectorAll('[id^="markdown-content"]'));

  var blocks = contentBlocks.map(function(block) {
    var headings = Array.from(block.querySelectorAll('h2'));
    var sections = [];

    if (headings.length > 0) {
      var firstHeading = headings[0];
      var introElements = [];
      var el = block.firstElementChild;
      while (el && el !== firstHeading) {
        introElements.push(el);
        el = el.nextElementSibling;
      }
      if (introElements.length > 0) {
        var introText = introElements
          .map(function(e) { return getCleanText(e); })
          .filter(function(t) { return t.length > 0; })
          .join('\\n\\n');
        if (introText.length > 0) {
          sections.push({ heading: '', text: introText });
        }
      }

      for (var i = 0; i < headings.length; i++) {
        var heading = headings[i];
        var headingText = (heading.textContent || '').trim();
        var siblings = collectSiblingsBetween(heading, 'H2');
        var sectionText = siblings
          .map(function(e) { return getCleanText(e); })
          .filter(function(t) { return t.length > 0; })
          .join('\\n\\n');
        sections.push({ heading: headingText, text: sectionText });
      }
    } else {
      sections.push({ heading: '', text: getCleanText(block) });
    }

    var fullCleanText = sections
      .map(function(s) {
        return s.heading ? '## ' + s.heading + '\\n\\n' + s.text : s.text;
      })
      .join('\\n\\n');

    return { sections: sections, fullCleanText: fullCleanText };
  });

  // 3. Extract sources from citation links
  var sourcesMap = new Map();

  document
    .querySelectorAll(
      'span.citation a[href], span.citation-inline a[href], [class*="citation"] a[href], a[data-testid*="citation"]'
    )
    .forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.includes('perplexity.ai')) return;

      var title =
        link.getAttribute('aria-label') ||
        (link.closest('[aria-label]') ? link.closest('[aria-label]').getAttribute('aria-label') : '') ||
        '';
      if (!title || title.length < 3) {
        title = (link.textContent || '').trim();
      }
      if (!title || title.length < 3) {
        try { title = new URL(href).hostname.replace('www.', ''); }
        catch(e) { title = href; }
      }
      if (!sourcesMap.has(href)) {
        sourcesMap.set(href, { title: title, url: href });
      }
    });

  contentBlocks.forEach(function(block) {
    block.querySelectorAll('a[href^="http"]').forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href.includes('perplexity.ai') || sourcesMap.has(href)) return;

      var ariaLabel =
        link.getAttribute('aria-label') ||
        (link.closest('[aria-label]') ? link.closest('[aria-label]').getAttribute('aria-label') : '') ||
        '';
      var linkText = (link.textContent || '').trim();
      var title = ariaLabel || linkText;
      if (!title || title.length < 3) {
        try { title = new URL(href).hostname.replace('www.', ''); }
        catch(e) { title = href; }
      }
      sourcesMap.set(href, { title: title, url: href });
    });
  });

  // 4. Extract page title
  var pageTitle = document.title || '';

  // 5. Build conversation turns
  var turns = [];
  var minPairs = Math.min(prompts.length, blocks.length);
  for (var i = 0; i < minPairs; i++) {
    var userMsg = prompts[i];
    var assistantMsg = blocks[i].fullCleanText;
    if (userMsg.length > 5 && assistantMsg.length > 50) {
      turns.push({ index: i, userMessage: userMsg, assistantMessage: assistantMsg });
    }
  }

  return {
    prompts: prompts,
    blocks: blocks.map(function(b) {
      return { sections: b.sections, fullCleanText: b.fullCleanText };
    }),
    sources: Array.from(sourcesMap.values()),
    pageTitle: pageTitle,
    turns: turns
  };
}`;

/**
 * Perplexity Structured DOM Extractor
 *
 * Extracts structured data directly from Perplexity's DOM rather than
 * collapsing to flat textContent. This preserves:
 * - Section headings (<h2>) for field mapping (Conclusion → abstract, Sources → references)
 * - Clean paragraph text without citation badge noise (e.g. "forestrycommission.blog+2")
 * - Source titles from aria-label attributes instead of domain abbreviations
 * - Multi-turn conversation support via span.select-text / markdown-content-N pairing
 */
export async function extractFromPerplexity(
  url: string,
  debugMode: boolean = false
): Promise<BriefData> {
  const logger = new ExtractionLogger('perplexity-structured', url);
  const overallStart = Date.now();

  logger.info('START', 'Starting Perplexity structured DOM extraction', { url });

  let browser;
  let page;

  try {
    // Step 1: Launch browser (non-headless to bypass Cloudflare)
    browser = await launchBrowser(logger, false);

    // Step 2: Navigate with retry
    const navStart = Date.now();
    page = await navigateWithRetry(browser, url, 30000, logger, 3, debugMode);
    const navigationTime = Date.now() - navStart;
    logger.info('NAVIGATION', `Navigation completed in ${navigationTime}ms`);

    // Step 3: Wait for Perplexity content to render
    logger.info('WAIT', 'Waiting for Perplexity content to load...');
    try {
      await page.waitForSelector('[id^="markdown-content"]', { timeout: 30000 });
      logger.info('WAIT', 'Found markdown-content element');
    } catch {
      logger.warn('WAIT', 'Timeout waiting for markdown-content, trying fallback selectors');
      // Try alternative selectors
      try {
        await page.waitForSelector('.prose, article, main', { timeout: 10000 });
        logger.info('WAIT', 'Found fallback content element');
      } catch {
        logger.error('WAIT', 'No content elements found');
      }
    }

    // Allow extra time for dynamic content (citations, sources)
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (debugMode) {
      await logger.saveHTML(await page.content(), 'after_content_wait.html');
      await logger.saveScreenshot(page, 'after_content_wait.png');
    }

    // Step 4: Extract structured data from DOM
    // NOTE: We pass a string to page.evaluate() to avoid tsx/esbuild injecting
    // `__name()` decorators into the browser context where they don't exist.
    logger.info('EXTRACT', 'Extracting structured data from DOM...');

    const domData = await page.evaluate(`(${BROWSER_EXTRACT_FN})()`) as DomExtractResult;

    logger.info('EXTRACT', `Extracted ${domData.blocks.length} content block(s)`, {
      prompts: domData.prompts.length,
      sections: domData.blocks.reduce((n, b) => n + b.sections.length, 0),
      sources: domData.sources.length,
      turns: domData.turns.length,
    });

    // Step 5: Map sections to BriefData fields
    logger.info('MAP_FIELDS', 'Mapping sections to brief fields...');

    const allSections = domData.blocks.flatMap((b) => b.sections);

    // Abstract: from Conclusion / Summary / Key Takeaways section
    const abstractPatterns = /^(conclusion|summary|key\s+takeaways?|executive\s+summary|overview|in\s+summary|findings?)$/i;
    const abstractSection = allSections.find(
      (s) => s.heading && abstractPatterns.test(s.heading.trim())
    );
    const abstract = abstractSection?.text || '';

    // References: from Sources / References section
    const referencesPatterns = /^(sources?|references?|citations?|bibliography|further\s+reading|works?\s+cited)$/i;
    const referencesSection = allSections.find(
      (s) => s.heading && referencesPatterns.test(s.heading.trim())
    );
    const references = referencesSection?.text || '';

    // Title: first heading if page title is generic, otherwise page title
    const firstHeadedSection = allSections.find((s) => s.heading.length > 0);
    const genericTitlePatterns = /^(perplexity|search|home|untitled)/i;
    let title = domData.pageTitle;
    if (!title || genericTitlePatterns.test(title)) {
      title = firstHeadedSection?.heading || domData.prompts[0] || 'Untitled Perplexity Research';
    }

    // Response: all sections joined with markdown headings, excluding
    // the references section (goes in `references` field) and the
    // abstract section (goes in `abstract` field) to avoid duplication.
    const responseSections = allSections.filter(
      (s) =>
        !s.heading ||
        (!referencesPatterns.test(s.heading.trim()) &&
          !abstractPatterns.test(s.heading.trim()))
    );
    const response = responseSections
      .map((s) => (s.heading ? `## ${s.heading}\n\n${s.text}` : s.text))
      .join('\n\n');

    // Prompt: first user query
    const prompt = domData.prompts[0] || '';

    // Sources
    const sources: BriefSource[] = domData.sources.filter(
      (s) =>
        !s.url.includes('facebook.com') &&
        !s.url.includes('twitter.com') &&
        !s.url.includes('linkedin.com') &&
        !s.url.includes('instagram.com')
    );

    // Conversation turns
    const conversationTurns: ConversationTurn[] = domData.turns.map((t) => ({
      index: t.index,
      userMessage: t.userMessage,
      assistantMessage: t.assistantMessage,
    }));

    logger.info('MAP_FIELDS', 'Field mapping complete', {
      titleLength: title.length,
      responseLength: response.length,
      abstractLength: abstract.length,
      referencesLength: references.length,
      promptLength: prompt.length,
      sourcesCount: sources.length,
      turnsCount: conversationTurns.length,
    });

    // Step 6: Validate extraction
    const validation = await validateExtraction(
      title,
      response,
      abstract,
      sources,
      logger
    );

    const totalTime = Date.now() - overallStart;

    logger.info('COMPLETE', `Extraction completed in ${(totalTime / 1000).toFixed(2)}s`, {
      confidence: validation.confidence,
      warnings: validation.warnings,
    });

    await logger.saveLogs();
    await browser.close();

    return {
      title,
      response,
      abstract,
      sources,
      references,
      thinking: '',
      prompt,
      model: 'perplexity',
      rawHtml: '',
      confidence: validation.confidence,
      warnings: validation.warnings,
      conversationTurns: conversationTurns.length > 0 ? conversationTurns : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('FATAL', 'Perplexity extraction failed', { error: message, stack });

    await logger.saveLogs();

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}
