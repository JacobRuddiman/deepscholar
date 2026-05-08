/**
 * Test script for debugging conversation turn detection
 * Usage: tsx scripts/test-conversation-detection.ts <url>
 */

import puppeteer from 'puppeteer';
import { detectConversationTurns } from '../src/functions/extractors/conversation_detector';
import { detectPlatform } from '../src/lib/extraction/platform';

async function testConversationDetection(url: string) {
  console.log('\n=== CONVERSATION DETECTION TEST ===');
  console.log(`URL: ${url}\n`);

  // Detect platform
  const platform = detectPlatform(url);
  console.log(`Platform: ${platform}\n`);

  const browser = await puppeteer.launch({
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('Navigating to URL...');
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // First, let's debug what selectors we're finding
    console.log('\n=== DEBUG: Checking selectors ===');

    if (platform === 'chatgpt' || platform === 'openai') {
      console.log('ChatGPT platform detected');

      // Check for message elements
      const messageCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-message-author-role]').length;
      });
      console.log(`Found ${messageCount} elements with [data-message-author-role]`);

      // Get details of each message
      const messageDetails = await page.evaluate(() => {
        const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));
        return messages.map((msg, idx) => ({
          index: idx,
          role: msg.getAttribute('data-message-author-role'),
          textLength: msg.textContent?.trim().length || 0,
          textPreview: msg.textContent?.trim().substring(0, 100) || '',
          classes: msg.className,
          hasDeepResearch: msg.querySelector('.deep-research-result') !== null
        }));
      });

      console.log('\nMessage Details:');
      messageDetails.forEach(msg => {
        console.log(`\n[${msg.index}] Role: ${msg.role}`);
        console.log(`  Length: ${msg.textLength} chars`);
        console.log(`  Preview: ${msg.textPreview}`);
        console.log(`  Has Deep Research: ${msg.hasDeepResearch}`);
        console.log(`  Classes: ${msg.classes}`);
      });

    } else if (platform === 'perplexity') {
      console.log('Perplexity platform detected');

      // Check for common Perplexity selectors
      const selectors = [
        '[data-testid="search-query"]',
        '[data-testid="copilot_answer"]',
        '[data-testid="answer"]',
        '[id^="markdown-content"]',
        '.query',
        '.answer-content',
        'input[type="search"]',
        '[data-testid*="message"]',
        '[data-testid*="query"]',
        '[data-testid*="response"]'
      ];

      for (const selector of selectors) {
        const count = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length;
        }, selector);

        if (count > 0) {
          console.log(`✓ Found ${count} elements: ${selector}`);

          const details = await page.evaluate((sel) => {
            const elements = Array.from(document.querySelectorAll(sel));
            return elements.map((el, idx) => ({
              index: idx,
              textLength: el.textContent?.trim().length || 0,
              textPreview: el.textContent?.trim().substring(0, 100) || '',
              tagName: el.tagName
            }));
          }, selector);

          details.forEach(d => {
            console.log(`  [${d.index}] <${d.tagName}> ${d.textLength} chars: ${d.textPreview}...`);
          });
        } else {
          console.log(`✗ Not found: ${selector}`);
        }
      }

      // Check DOM structure
      console.log('\n=== DOM Structure ===');
      const structure = await page.evaluate(() => {
        const body = document.body;

        // Try to find query/prompt elements by looking for text patterns
        const allDivs = Array.from(document.querySelectorAll('div'));
        const possibleQueries = allDivs.filter(div => {
          const text = div.textContent?.trim() || '';
          // Queries are usually short, end with ?, and don't have nested markdown
          return text.length > 10 &&
                 text.length < 500 &&
                 !div.querySelector('[id^="markdown-content"]') &&
                 !div.id.startsWith('markdown-content');
        }).map(div => ({
          text: div.textContent?.trim().substring(0, 150) || '',
          classes: div.className,
          id: div.id
        })).slice(0, 20); // First 20 candidates

        return {
          title: document.title,
          bodyClasses: body.className,
          mainSelectors: [
            { selector: 'main', count: document.querySelectorAll('main').length },
            { selector: 'article', count: document.querySelectorAll('article').length },
            { selector: '[role="main"]', count: document.querySelectorAll('[role="main"]').length }
          ],
          possibleQueries
        };
      });
      console.log('Title:', structure.title);
      console.log('Body classes:', structure.bodyClasses);
      structure.mainSelectors.forEach(s => {
        console.log(`${s.selector}: ${s.count} found`);
      });

      console.log('\n=== Possible Query Elements ===');
      structure.possibleQueries.forEach((q, i) => {
        console.log(`[${i}] ${q.text}`);
        if (q.classes) console.log(`    Classes: ${q.classes}`);
        if (q.id) console.log(`    ID: ${q.id}`);
      });
    }

    // Now run the actual detection
    console.log('\n=== RUNNING CONVERSATION DETECTION ===');
    const turns = await detectConversationTurns(page, platform);

    console.log(`\nDetected ${turns.length} conversation turn(s)\n`);

    // Always save HTML for inspection
    const html = await page.content();
    const fs = await import('fs/promises');
    const path = await import('path');
    const filename = path.join(process.cwd(), 'extraction_logs', `conversation-debug-${platform}-${Date.now()}.html`);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, html);
    console.log(`\nHTML saved to: ${filename}`);

    if (turns.length === 0) {
      console.log('❌ No turns detected!');
    } else {
      turns.forEach((turn, idx) => {
        console.log(`\n=== Turn ${idx + 1} ===`);
        console.log(`Index: ${turn.index}`);
        console.log(`User Message (${turn.userMessage.length} chars):`);
        console.log(turn.userMessage.substring(0, 200));
        console.log('\nAssistant Message (${turn.assistantMessage.length} chars):');
        console.log(turn.assistantMessage.substring(0, 200));
        console.log('...');
      });
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Browser will stay open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
const url = process.argv[2];
if (!url) {
  console.error('Usage: tsx scripts/test-conversation-detection.ts <url>');
  process.exit(1);
}

testConversationDetection(url).catch(console.error);
