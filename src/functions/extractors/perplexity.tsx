'use server';

import puppeteer from 'puppeteer';
import { BriefData, BriefSource } from '../types';

// Perplexity specific extractor
export async function extractFromPerplexity(url: string): Promise<BriefData> {
  // url parameter is typed as string to ensure the function only accepts URL strings
  // Promise<BriefData> return type ensures this function returns a Promise that resolves to a BriefData object
  
  // Launch a headless browser with enhanced anti-detection measures
  const browser = await puppeteer.launch({
    headless: 'new' as any, // Type assertion to fix TypeScript error
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  
  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Set additional headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // Navigate to the URL with longer timeout
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for initial page load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we hit a private thread or login requirement
    const isPrivateThread = await page.evaluate(() => {
      return document.body.textContent?.includes('This thread is private') ||
             document.body.textContent?.includes('Sign in') ||
             document.body.textContent?.includes('Sign into continue to perplexity.ai') ||
             document.querySelector('[data-testid="login"]') !== null ||
             document.querySelector('.login-modal') !== null;
    });
    
    if (isPrivateThread) {
      console.log('Detected private thread or login requirement');
      
      // First, try to find and click close buttons for sign-in modals
      try {
        const closeButtonClicked = await page.evaluate(() => {
          // Look for various close button patterns
          const closeSelectors = [
            'button[aria-label="Close"]',
            'button[aria-label="close"]', 
            'button[title="Close"]',
            'button[title="close"]',
            '.close-button',
            '.modal-close',
            '[data-testid="close-button"]',
            '[data-testid="modal-close"]',
            'button:has([data-icon="close"])',
            'button:has([data-icon="x"])',
            // Look for buttons with × or X text
            'button'
          ];
          
          for (const selector of closeSelectors) {
            const buttons = Array.from(document.querySelectorAll(selector));
            for (const button of buttons) {
              const text = button.textContent?.trim() || '';
              const ariaLabel = button.getAttribute('aria-label') || '';
              
              // Check if it's a close button
              if (text === '×' || text === 'X' || text === '✕' ||
                  ariaLabel.toLowerCase().includes('close') ||
                  button.getAttribute('title')?.toLowerCase().includes('close')) {
                
                if (button instanceof HTMLElement) {
                  button.click();
                  return true;
                }
              }
            }
          }
          return false;
        });
        
        if (closeButtonClicked) {
          console.log('Found and clicked close button for sign-in modal');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        console.log('No close button found or failed to click');
      }
      
      // Try to find and click any "View anyway" or "Continue" buttons
      try {
        const buttonClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const continueButton = buttons.find(button => {
            const text = button.textContent?.toLowerCase() ?? '';
            return text.includes('continue') || 
                   text.includes('view') || 
                   text.includes('proceed') ||
                   button.getAttribute('data-testid') === 'continue-button';
          });
          
          if (continueButton && continueButton instanceof HTMLElement) {
            continueButton.click();
            return true;
          }
          return false;
        });
        
        if (buttonClicked) {
          console.log('Found and clicked continue button');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        console.log('No continue button found or failed to click');
      }
      
      // Try to close any modals
      const closeButtons = await page.$$('button[aria-label="Close"], .modal-close, [data-testid="close-button"]');
      for (const button of closeButtons) {
        try {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          // Ignore click errors
        }
      }
    }
    
    // Wait longer for JavaScript-rendered content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try multiple strategies to wait for content
    const contentSelectors = [
      '[data-testid="copilot_answer"]',
      '.prose',
      '.answer-content', 
      '.md\\:prose',
      '[class*="answer"]',
      '[class*="response"]',
      '.markdown-content',
      '.content-wrapper',
      '[data-testid="thread-content"]',
      '.thread-content'
    ];
    
    let contentFound = false;
    for (const selector of contentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log('Found content with selector:', selector);
        contentFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!contentFound) {
      console.log('No specific content selectors found, continuing with page content...');
    }
    
    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract the title from the page
    const title = await page.title();
    
    // Extract the main content, abstract, and references using Perplexity-specific selectors
    const { mainContent, abstractContent, referencesList } = await page.evaluate(() => {
      let mainSection = '';
      let abstractSection = '';
      let referenceSection = '';
      
      // Try Perplexity-specific selectors
      const perplexitySelectors = [
        '[data-testid="copilot_answer"]',
        '.prose',
        '.answer-content',
        '.md\\:prose',
        '[class*="answer"]',
        '[class*="response"]',
        '.markdown-content',
        '.content-wrapper'
      ];
      
      let contentContainer = null;
      
      // Find the main content container
      for (const selector of perplexitySelectors) {
        contentContainer = document.querySelector(selector);
        if (contentContainer) {
          console.log('Found content with selector:', selector);
          break;
        }
      }
      
      if (contentContainer) {
        const fullText = contentContainer.textContent || '';
        
        // Look for conclusion/summary patterns
        const conclusionPatterns = [
          /\b(conclusion|summary|in summary|to summarize|overall|in conclusion)\b/i,
          /\b(key takeaways?|main points?|findings?)\b/i
        ];
        
        // Look for references patterns
        const referencesPatterns = [
          /\b(references?|sources?|citations?|bibliography)\s*:?\s*$/im,
          /\b(read more|learn more|additional resources?)\b/i
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
          const conclusionIndex = conclusionMatch.index || 0;
          const referencesIndex = referencesMatch.index || 0;
          
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
          const referencesIndex = referencesMatch.index || 0;
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
          const conclusionIndex = conclusionMatch.index || 0;
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
          '.content'
        ];
        
        for (const selector of fallbackSelectors) {
          const fallbackContainer = document.querySelector(selector);
          if (fallbackContainer) {
            mainSection = fallbackContainer.textContent || '';
            break;
          }
        }
        
        if (!mainSection) {
          // Last resort - get body text but filter out navigation and other noise
          const bodyText = document.body.textContent || '';
          // Simple heuristic to get the main content (usually the longest paragraph)
          const paragraphs = bodyText.split('\n\n').filter(p => p.trim().length > 100);
          mainSection = paragraphs.join('\n\n');
        }
      }
      
      return {
        mainContent: mainSection.trim(),
        abstractContent: abstractSection.trim(),
        referencesList: referenceSection.trim()
      };
    });
    
    // Extract sources (links) using Perplexity-specific selectors
    const sources = await page.evaluate(() => {
      const sourceLinks: BriefSource[] = [];
      
      // Perplexity-specific link selectors
      const linkSelectors = [
        '[data-testid="copilot_answer"] a[href^="http"]',
        '.prose a[href^="http"]',
        '.answer-content a[href^="http"]',
        '.sources a[href^="http"]',
        '.citations a[href^="http"]',
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
        const url = link.getAttribute('href') || '';
        // Use textContent or the hostname as fallback for title
        const title = link.textContent?.trim() || new URL(url).hostname;
        
        // Skip Perplexity's own links and duplicates
        if (!url.includes('perplexity.ai') && 
            !url.includes('perplexity.com') && 
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
    const model: "OpenAI" | "Perplexity" | "Anthropic" | "Other" = "Perplexity";
    
    // Extract thinking content (this is usually not visible in Perplexity responses,
    // but we keep this as a placeholder)
    const thinking = "";
    
    console.info("At perplexity.tsx, model = " + model);
    
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
