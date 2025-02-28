'use server';

import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Define the return type to match what the client expects
export type BriefSource = {
  title: string;
  url: string;
  author?: string;
  date?: string;
};

export type BriefData = {
  title: string;
  content: string;
  abstract: string; // Add abstract/summary section
  sources: BriefSource[];
  thinking: string;
  model: "OpenAI" | "Perplexity" | "Anthropic" | "Other";
  rawHtml?: string;
  references?: string; // Add optional references section
};

export async function extractBriefFromUrl(url: string): Promise<BriefData> {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set a realistic viewport and user agent
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000 // Increased timeout for slower connections
      });
      
      // Wait for main response content to load
      await page.waitForSelector('div.markdown', { timeout: 10000 }).catch(() => console.log('Markdown element not found, continuing anyway'));
      
      // Make sure to wait for deep research results
      await page.waitForSelector('div.deep-research-result', { timeout: 5000 }).catch(() => console.log('Deep research result not found, continuing anyway'));
      
      // Give the page a bit more time to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the page title
      const title = await page.title().then(t => t.replace(' - ChatGPT', '').trim());
      
      // Extract only the last complete response
      const { mainContent, abstractContent, referencesList } = await page.evaluate(() => {
        // Helper function to get text content from elements
        const getTextFromElements = (elements) => {
          return elements
            .map(el => el.textContent)
            .filter(Boolean)
            .join('\n\n');
        };
        
        // Find the last full research response (typically has the "deep-research-result" class)
        const researchResults = document.querySelectorAll('div.deep-research-result');
        let mainSection = '';
        let abstractSection = '';
        let referenceSection = '';
        
        if (researchResults && researchResults.length > 0) {
          // Get the latest research result
          const lastResearchResult = researchResults[researchResults.length - 1];
          
          // Find all sections by headers
          const headers = Array.from(lastResearchResult.querySelectorAll('h1, h2, h3, h4'));
          
          // Look specifically for conclusion/summary section
          const conclusionHeader = headers.find(header => {
            const headerText = header.textContent?.trim().toLowerCase() || '';
            return headerText === 'conclusion' || 
                   headerText.includes('conclusion') || 
                   headerText === 'summary' || 
                   headerText.includes('summary') ||
                   headerText === 'abstract' ||
                   headerText.includes('tldr');
          });
          
          // If we found a conclusion section, extract its content
          if (conclusionHeader) {
            let currentElement = conclusionHeader.nextElementSibling;
            const conclusionContent = [];
            
            // Collect all elements until the next header or end of container
            while (currentElement && 
                  !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
              if (currentElement.textContent?.trim()) {
                conclusionContent.push(currentElement.textContent.trim());
              }
              currentElement = currentElement.nextElementSibling;
            }
            
            // Join all the conclusion content
            let fullConclusionText = conclusionContent.join('\n\n');
            
            // Check if conclusion contains references
            const referencesMatch = fullConclusionText.match(/references\s*:/i);
            if (referencesMatch) {
              const referencesIndex = referencesMatch.index;
              abstractSection = fullConclusionText.substring(0, referencesIndex).trim();
              referenceSection = fullConclusionText.substring(referencesIndex).trim();
            } else {
              abstractSection = fullConclusionText;
            }
            
            // For the main content, we want everything except the conclusion section
            // Split the main content by headings
            const contentParts = [];
            let currentHeading = null;
            let isInConclusionSection = false;
            
            // Process all elements in the research result
            const allElements = Array.from(lastResearchResult.children);
            for (const element of allElements) {
              // If this is a header, check if it's the conclusion header
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
                const headerText = element.textContent?.trim().toLowerCase() || '';
                isInConclusionSection = headerText === 'conclusion' || 
                                        headerText.includes('conclusion') || 
                                        headerText === 'summary' || 
                                        headerText.includes('summary') ||
                                        headerText === 'abstract' ||
                                        headerText.includes('tldr');
                
                if (!isInConclusionSection) {
                  currentHeading = element.textContent;
                  contentParts.push(`## ${currentHeading}`);
                }
              } 
              // If not in conclusion section and not a header, add to content
              else if (!isInConclusionSection) {
                if (element.textContent?.trim()) {
                  contentParts.push(element.textContent.trim());
                }
              }
            }
            
            mainSection = contentParts.join('\n\n');
          } else {
            // If no specific conclusion section found, check for "Conclusion" text or "References" text
            const fullText = lastResearchResult.textContent || '';
            
            // Look for explicit "Conclusion" text
            const conclusionMatch = fullText.match(/\bconclusion\b/i);
            const referencesMatch = fullText.match(/\breferences\s*:/i);
            
            if (conclusionMatch && referencesMatch) {
              // If we have both conclusion and references
              const conclusionIndex = conclusionMatch.index;
              const referencesIndex = referencesMatch.index;
              
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
              const referencesIndex = referencesMatch.index;
              mainSection = fullText.substring(0, referencesIndex).trim();
              referenceSection = fullText.substring(referencesIndex).trim();
              
              // Try to extract the last paragraph before references as abstract
              const paragraphs = mainSection.split('\n\n');
              if (paragraphs.length > 1) {
                abstractSection = paragraphs[paragraphs.length - 1];
                mainSection = paragraphs.slice(0, -1).join('\n\n');
              }
            } else if (conclusionMatch) {
              // If we only have conclusion but no references
              const conclusionIndex = conclusionMatch.index;
              abstractSection = fullText.substring(conclusionIndex).trim();
              mainSection = fullText.substring(0, conclusionIndex).trim();
            } else {
              // If no explicit conclusion or references markers
              mainSection = fullText;
              
              // Try to extract the last paragraph as an abstract if it's not too long
              const paragraphs = mainSection.split('\n\n');
              if (paragraphs.length > 2 && paragraphs[paragraphs.length - 1].length < 1000) {
                abstractSection = paragraphs[paragraphs.length - 1];
                mainSection = paragraphs.slice(0, -1).join('\n\n');
              }
            }
          }
        } else {
          // Fallback: if no specific research result found, look for the last assistant message
          const assistantMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
          if (assistantMessages && assistantMessages.length > 0) {
            // Get the last message
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            const fullText = lastMessage.textContent || '';
            
            // Look for references section
            const referencesMatch = fullText.match(/\breferences\s*:/i);
            if (referencesMatch) {
              const referencesIndex = referencesMatch.index;
              mainSection = fullText.substring(0, referencesIndex).trim();
              referenceSection = fullText.substring(referencesIndex).trim();
              
              // Try to identify if the message has a conclusion/summary paragraph
              const paragraphs = mainSection.split('\n\n');
              for (let i = 0; i < paragraphs.length; i++) {
                const para = paragraphs[i].toLowerCase();
                if (para.includes('conclusion') || para.includes('summary') || 
                    para.includes('to summarize') || para.includes('in summary')) {
                  abstractSection = paragraphs.slice(i).join('\n\n');
                  mainSection = paragraphs.slice(0, i).join('\n\n');
                  break;
                }
              }
              
              // If no obvious conclusion, just use the last paragraph if not too long
              if (!abstractSection && paragraphs.length > 2) {
                const lastPara = paragraphs[paragraphs.length - 1];
                if (lastPara.length < 1000) {
                  abstractSection = lastPara;
                  mainSection = paragraphs.slice(0, -1).join('\n\n');
                }
              }
            } else {
              mainSection = fullText;
            }
          }
        }
        
        return {
          mainContent: mainSection.trim(),
          abstractContent: abstractSection.trim(),
          referencesList: referenceSection.trim()
        };
      });
      
      // Extract sources and other metadata
      const sources = await page.evaluate(() => {
        const sourceLinks: Array<{title: string, url: string}> = [];
        
        // Find all links in the research result
        const links = Array.from(document.querySelectorAll('div.deep-research-result a[href^="http"], div.markdown a[href^="http"]'));
        
        links.forEach(link => {
          const url = link.getAttribute('href') || '';
          // Use textContent or the hostname as fallback for title
          const title = link.textContent?.trim() || new URL(url).hostname;
          
          // Skip OpenAI's own links and duplicates
          if (!url.includes('chatgpt.com') && 
              !url.includes('openai.com/policies') && 
              !sourceLinks.some(s => s.url === url)) {
            sourceLinks.push({ title, url });
          }
        });
        
        return sourceLinks;
      });
      
      // Get model information if available
      let model = "OpenAI";
      
      // Extract thinking content (this is usually not visible in ChatGPT responses,
      // but we keep this as a placeholder)
      const thinking = "";
      
      return {
        title,
        content: mainContent || "No content could be extracted",
        abstract: abstractContent || "No summary available",
        sources,
        references: referencesList || "No references available",
        thinking,
        model,
        rawHtml: await page.content()
      };
    } finally {
      // Always close the browser to prevent resource leaks
      await browser.close();
    }
  } catch (error) {
    console.error("Error extracting brief:", error);
    throw new Error(`Failed to extract brief information: ${error instanceof Error ? error.message : String(error)}`);
  }
}