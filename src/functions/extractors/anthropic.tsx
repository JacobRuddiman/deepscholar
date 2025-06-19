'use server';

import puppeteer from 'puppeteer';
import { BriefData, BriefSource } from '../types';

// Anthropic/Claude specific extractor
export async function extractFromAnthropic(url: string): Promise<BriefData> {
  // url parameter is typed as string to ensure the function only accepts URL strings
  // Promise<BriefData> return type ensures this function returns a Promise that resolves to a BriefData object
  
  // Launch a headless browser with maximum anti-detection measures for Cloudflare
  const browser = await puppeteer.launch({
    headless: 'new' as any, // Type assertion to fix TypeScript error
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=site-per-process',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  
  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete (window as any).navigator.webdriver;
      
      // Mock chrome property
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
    
    // Set comprehensive headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Set viewport to common desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the URL with extended timeout
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Check if we hit Cloudflare challenge
    const isCloudflareChallenge = await page.evaluate(() => {
      return document.body.textContent?.includes('Verify you are human') ||
             document.body.textContent?.includes('cloudflare') ||
             document.querySelector('.cf-browser-verification') !== null ||
             document.querySelector('#challenge-form') !== null;
    });
    
    if (isCloudflareChallenge) {
      console.log('Detected Cloudflare challenge, attempting to wait...');
      
      // Try to wait for the challenge to complete
      try {
        await page.waitForFunction(
          () => !document.body.textContent?.includes('Verify you are human'),
          { timeout: 30000 }
        );
        console.log('Cloudflare challenge appears to have completed');
      } catch (error) {
        console.log('Cloudflare challenge did not complete automatically');
        // Continue anyway - we'll extract what we can
      }
    }
    
    // Wait for Claude-specific content to load
    await page.waitForSelector('[data-testid="conversation"], .conversation, .message, .claude-message, .assistant-message', { 
      timeout: 15000 
    }).catch(() => {
      console.log('Timeout waiting for Claude content selector. Continuing anyway.');
    });
    
    // Extract the title from the page
    const title = await page.title();
    
    // Extract the main content, abstract, and references using Claude-specific selectors
    const { mainContent, abstractContent, referencesList } = await page.evaluate(() => {
      let mainSection = '';
      let abstractSection = '';
      let referenceSection = '';
      
      // Try Claude-specific selectors
      const claudeSelectors = [
        '[data-testid="conversation"]',
        '.conversation',
        '.message',
        '.claude-message',
        '.assistant-message',
        '[data-testid="message"]',
        '.prose',
        '.markdown',
        '.content'
      ];
      
      let contentContainer = null;
      
      // Find the main content container
      for (const selector of claudeSelectors) {
        const containers = document.querySelectorAll(selector);
        if (containers.length > 0) {
          // Get the last message (most recent response)
          contentContainer = containers[containers.length - 1];
          console.log('Found content with selector:', selector);
          break;
        }
      }
      
      if (contentContainer) {
        const fullText = contentContainer.textContent ?? '';
        
        // Look for conclusion/summary patterns
        const conclusionPatterns = [
          /\b(conclusion|summary|in summary|to summarize|overall|in conclusion)\b/i,
          /\b(key takeaways?|main points?|findings?)\b/i,
          /\b(final thoughts?|wrap.?up)\b/i
        ];
        
        // Look for references patterns
        const referencesPatterns = [
          /\b(references?|sources?|citations?|bibliography)\s*:?\s*$/im,
          /\b(read more|learn more|additional resources?)\b/i,
          /\b(further reading|see also)\b/i
        ];
        
        let conclusionMatch = null;
        let referencesMatch = null;
        
        // Find conclusion section
        for (const pattern of conclusionPatterns) {
          conclusionMatch = fullText.match(pattern);
          if (conclusionMatch) break;
        }
        
        // Find references section
        for (const pattern of referencesPatterns) {
          referencesMatch = fullText.match(pattern);
          if (referencesMatch) break;
        }
        
        if (conclusionMatch && referencesMatch) {
          const conclusionIndex = conclusionMatch.index ?? 0;
          const referencesIndex = referencesMatch.index ?? 0;
          
          if (referencesIndex > conclusionIndex) {
            // Extract conclusion text (between "Conclusion" and "References")
            abstractSection = fullText.substring(conclusionIndex, referencesIndex).trim();
            // Extract references
            referenceSection = fullText.substring(referencesIndex).trim();
            // Main content is everything before conclusion
            mainSection = fullText.substring(0, conclusionIndex).trim();
          } else {
            // If references come before conclusion (unusual)
            abstractSection = fullText.substring(conclusionIndex).trim();
            referenceSection = fullText.substring(referencesIndex, conclusionIndex).trim();
            mainSection = fullText.substring(0, referencesIndex).trim();
          }
        } else if (referencesMatch) {
          // If we only have references but no conclusion
          const referencesIndex = referencesMatch.index ?? 0;
          mainSection = fullText.substring(0, referencesIndex).trim();
          referenceSection = fullText.substring(referencesIndex).trim();
          
          // Try to extract the last paragraph before references as abstract
          const paragraphs = mainSection.split('\n\n');
          if (paragraphs.length > 1) {
            const lastPara = paragraphs[paragraphs.length - 1];
            if (lastPara && lastPara.length < 1000) {
              abstractSection = lastPara;
              mainSection = paragraphs.slice(0, -1).join('\n\n');
            }
          }
        } else if (conclusionMatch) {
          // If we only have conclusion but no references
          const conclusionIndex = conclusionMatch.index ?? 0;
          abstractSection = fullText.substring(conclusionIndex).trim();
          mainSection = fullText.substring(0, conclusionIndex).trim();
        } else {
          // If no explicit conclusion or references markers
          mainSection = fullText;
          
          // Try to extract the last paragraph as an abstract if it's not too long
          const paragraphs = mainSection.split('\n\n');
          if (paragraphs.length > 2) {
            const lastPara = paragraphs[paragraphs.length - 1];
            if (lastPara && lastPara.length < 1000) {
              abstractSection = lastPara;
              mainSection = paragraphs.slice(0, -1).join('\n\n');
            }
          }
        }
      } else {
        // Fallback: try to get any text content from the page
        const fallbackSelectors = [
          'main',
          '[role="main"]',
          '.main-content',
          'article',
          '.content',
          'body'
        ];
        
        for (const selector of fallbackSelectors) {
          const fallbackContainer = document.querySelector(selector);
          if (fallbackContainer) {
            const bodyText = fallbackContainer.textContent ?? '';
            // Filter out common navigation and footer text
            const lines = bodyText.split('\n').filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 20 && 
                     !trimmed.includes('claude.ai') &&
                     !trimmed.includes('Cloudflare') &&
                     !trimmed.includes('Ray ID') &&
                     !trimmed.includes('Performance & security');
            });
            mainSection = lines.join('\n');
            break;
          }
        }
      }
      
      return {
        mainContent: mainSection.trim(),
        abstractContent: abstractSection.trim(),
        referencesList: referenceSection.trim()
      };
    });
    
    // Extract sources (links) using Claude-specific selectors
    const sources = await page.evaluate(() => {
      const sourceLinks: BriefSource[] = [];
      
      // Claude-specific link selectors
      const linkSelectors = [
        '[data-testid="conversation"] a[href^="http"]',
        '.conversation a[href^="http"]',
        '.message a[href^="http"]',
        '.claude-message a[href^="http"]',
        '.assistant-message a[href^="http"]',
        '.prose a[href^="http"]',
        'a[href^="http"]' // fallback
      ];
      
      let links: Element[] = [];
      
      // Try each selector until we find links
      for (const selector of linkSelectors) {
        links = Array.from(document.querySelectorAll(selector));
        if (links.length > 0) {
          console.log('Found links with selector:', selector);
          break;
        }
      }
      
      links.forEach(link => {
        const url = link.getAttribute('href') ?? '';
        // Use textContent or the hostname as fallback for title
        const title = link.textContent?.trim() || new URL(url).hostname;
        
        // Skip Claude's own links and duplicates
        if (!url.includes('claude.ai') && 
            !url.includes('anthropic.com') &&
            !url.includes('cloudflare.com') &&
            !sourceLinks.some(s => s.url === url)) {
          sourceLinks.push({ title, url });
        }
      });
      
      return sourceLinks;
    });
    
    // Format references to have bullet points
    const formattedReferences = referencesList
      ? referencesList
          .split('\n')
          .filter(line => line.trim())
          .filter((line, index) => {
            // Remove first line if it has less than 4 words
            if (index === 0) {
              const wordCount = line.trim().split(/\s+/).length;
              return wordCount >= 4;
            }
            return true;
          })
          .map(line => `• ${line.trim()}`)
          .join('\n')
      : "No references available";
    
    // Get model information
    const model: "OpenAI" | "Perplexity" | "Anthropic" | "Other" = "Anthropic";
    
    // Extract thinking content (this is usually not visible in Claude responses,
    // but we keep this as a placeholder)
    const thinking = "";
    
    console.info("At anthropic.tsx, model = " + model);
    
    return {
      title,
      content: mainContent || "No content could be extracted",
      abstract: abstractContent || "No summary available",
      sources,
      references: formattedReferences,
      thinking,
      model,
      rawHtml: await page.content()
    };
  } finally {
    // Always close the browser to prevent resource leaks
    await browser.close();
  }
}
