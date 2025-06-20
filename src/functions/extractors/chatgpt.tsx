'use server';

import puppeteer from 'puppeteer';
import { BriefData, BriefSource } from '../types';

// ChatGPT specific extractor
export async function extractFromChatGPT(url: string): Promise<BriefData> {
  // url parameter is typed as string to ensure the function only accepts URL strings
  // Promise<BriefData> return type ensures this function returns a Promise that resolves to a BriefData object
    // Launch a headless browser
    const browser = await puppeteer.launch({
    headless: 'new' as any, // Type assertion to fix TypeScript error
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
    // Open a new page
      const page = await browser.newPage();
      
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for the content to load
    await page.waitForSelector('div.flex.flex-col.pb-9.text-sm', { timeout: 10000 }).catch(() => {
      console.log('Timeout waiting for main content selector. Continuing anyway.');
    });
    
    // Extract the title from the page
    const title = await page.title();
    
    // Extract the main content, abstract, and references
      const { mainContent, abstractContent, referencesList } = await page.evaluate(() => {
        // Helper function to convert inline links to markdown format
        const preserveLinksAsMarkdown = (element) => {
          if (!element) return '';
          
          // Clone the element to avoid modifying the original
          const clone = element.cloneNode(true);
          
          // Find all anchor tags within the element
          const links = clone.querySelectorAll('a');
          
          links.forEach(link => {
            const url = link.getAttribute('href') || '';
            const text = link.textContent || '';
            
            // Create a markdown link format
            const markdownLink = ` [${text}](${url}) `;
            
            // Replace the link element with the markdown text
            const textNode = document.createTextNode(markdownLink);
            link.parentNode.replaceChild(textNode, link);
          });
          
          // Return the text content with preserved markdown links
          return clone.textContent || '';
        };
        
        // Helper function to get text content from elements
      const getTextFromElements = (elements: Element[]) => {
          // elements parameter is typed as Element[] to ensure the function accepts an array of DOM Elements
          return elements
            .map(el => el.textContent)
            .filter(Boolean)
            .join('\n\n');
        };
        
        let mainSection = '';
        let abstractSection = '';
        let referenceSection = '';
        
      // Try to find the research result container
      const researchResults = document.querySelectorAll('div.deep-research-result, div.markdown');
      
      if (researchResults.length > 0) {
        // Get the last research result (most relevant for our purpose)
          const lastResearchResult = researchResults[researchResults.length - 1];
          
        if (lastResearchResult) {
          // Find all sections by headers
          const headers = Array.from(lastResearchResult.querySelectorAll('h1, h2, h3, h4'));
          
          // Look specifically for conclusion/summary section
          const conclusionHeader = headers.find(header => {
            const headerText = header.textContent?.toLowerCase() || '';
            return headerText.includes('conclusion') || 
                   headerText.includes('summary') ||
                   headerText.includes('abstract');
          });
          
          // Look for references section
          const referencesHeader = headers.find(header => {
            const headerText = header.textContent?.toLowerCase() || '';
            return headerText.includes('reference') || 
                   headerText.includes('citation') || 
                   headerText.includes('bibliography');
          });
          
          if (conclusionHeader) {
            let fullConclusionElement = conclusionHeader.nextElementSibling;
            let abstractWithLinks = '';
            
            while (fullConclusionElement && 
                  !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(fullConclusionElement.tagName)) {
              abstractWithLinks += preserveLinksAsMarkdown(fullConclusionElement) + '\n\n';
              fullConclusionElement = fullConclusionElement.nextElementSibling;
            }
            
            abstractSection = abstractWithLinks.trim();
            
            // Extract main content (everything before conclusion)
            mainSection = '';
            let inMainSection = true;
            
            // Process all elements in the research result
            const allElements = Array.from(lastResearchResult.children);
            for (const element of allElements) {
              // If this is a header, check if it's the conclusion header
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
                const headerText = element.textContent?.toLowerCase() || '';
                if (headerText.includes('conclusion') || 
                                        headerText.includes('summary') ||
                    headerText.includes('abstract')) {
                  inMainSection = false;
                }
                
                // If we find references header, stop collecting main content
                if (headerText.includes('reference') || 
                    headerText.includes('citation') || 
                    headerText.includes('bibliography')) {
                  inMainSection = false;
                  referenceSection = element.textContent + '\n\n';
                  
                  // Collect all elements for references
                  let currentRefElement = element.nextElementSibling;
                  while (currentRefElement) {
                    referenceSection += currentRefElement.textContent + '\n\n';
                    currentRefElement = currentRefElement.nextElementSibling;
                  }
                }
              }
              
              // If we're still in main section, add this element's content with preserved links
              if (inMainSection) {
                mainSection += preserveLinksAsMarkdown(element) + '\n\n';
              }
            }
          } else {
            // If no specific conclusion section found, check for "Conclusion" text or "References" text
            const fullText = lastResearchResult.textContent || '';
            
            // Look for explicit "Conclusion" text
            const conclusionMatch = fullText.match(/\bconclusion\b/i);
            const referencesMatch = fullText.match(/\breferences\b/i);
            
            if (conclusionMatch && referencesMatch) {
              const conclusionIndex = conclusionMatch.index;
              const referencesIndex = referencesMatch.index;
              
              if (referencesIndex !== undefined && conclusionIndex !== undefined && referencesIndex > conclusionIndex) {
                // Extract conclusion text (between "Conclusion" and "References")
                abstractSection = fullText.substring(conclusionIndex, referencesIndex).trim();
                // Extract references
                referenceSection = fullText.substring(referencesIndex).trim();
                // Main content is everything before conclusion
                mainSection = fullText.substring(0, conclusionIndex).trim();
              } else if (referencesIndex !== undefined && conclusionIndex !== undefined) {
                // If references come before conclusion (unusual)
                abstractSection = fullText.substring(conclusionIndex).trim();
                referenceSection = fullText.substring(referencesIndex, conclusionIndex).trim();
                mainSection = fullText.substring(0, referencesIndex).trim();
              }
            } else if (referencesMatch && referencesMatch.index !== undefined) {
              // If we only have references but no conclusion
              const referencesIndex = referencesMatch.index;
              mainSection = fullText.substring(0, referencesIndex).trim();
              referenceSection = fullText.substring(referencesIndex).trim();
              
              // Try to extract the last paragraph before references as abstract
              const paragraphs = mainSection.split('\n\n');
              if (paragraphs.length > 1) {
                const lastPara = paragraphs[paragraphs.length - 1];
                if (lastPara) {
                  abstractSection = lastPara;
                mainSection = paragraphs.slice(0, -1).join('\n\n');
                }
              }
            } else if (conclusionMatch && conclusionMatch.index !== undefined) {
              // If we only have conclusion but no references
              const conclusionIndex = conclusionMatch.index;
              abstractSection = fullText.substring(conclusionIndex).trim();
              mainSection = fullText.substring(0, conclusionIndex).trim();
            } else {
              // If no explicit conclusion or references markers
              mainSection = fullText;
              
              // Try to extract the last paragraph as an abstract if it's not too long
              const paragraphs = mainSection.split('\n\n');
              if (paragraphs.length > 2) {
                const lastPara = paragraphs[paragraphs.length - 1];
                if (lastPara) {
                  abstractSection = lastPara;
                mainSection = paragraphs.slice(0, -1).join('\n\n');
                }
              }
            }
          }
        } else {
          // Fallback: try to extract from assistant messages
          const assistantMessages = document.querySelectorAll('.markdown');
          if (assistantMessages.length > 0) {
            // Get the last message
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            if (lastMessage) {
            const fullText = lastMessage.textContent || '';
            
            // Look for references section
            const referencesMatch = fullText.match(/\breferences\s*:/i);
              if (referencesMatch && referencesMatch.index !== undefined) {
              const referencesIndex = referencesMatch.index;
              mainSection = fullText.substring(0, referencesIndex).trim();
              referenceSection = fullText.substring(referencesIndex).trim();
              
              // Try to identify if the message has a conclusion/summary paragraph
              const paragraphs = mainSection.split('\n\n');
              for (let i = 0; i < paragraphs.length; i++) {
                  const para = paragraphs[i];
                  if (para && (
                    para.toLowerCase().includes('conclusion') || 
                    para.toLowerCase().includes('summary') || 
                    para.toLowerCase().includes('to summarize') || 
                    para.toLowerCase().includes('in summary')
                  )) {
                  abstractSection = paragraphs.slice(i).join('\n\n');
                  mainSection = paragraphs.slice(0, i).join('\n\n');
                  break;
                }
              }
              
                // If no conclusion paragraph found, use the last paragraph as abstract
              if (!abstractSection && paragraphs.length > 2) {
                const lastPara = paragraphs[paragraphs.length - 1];
                  if (lastPara) {
                  abstractSection = lastPara;
                  mainSection = paragraphs.slice(0, -1).join('\n\n');
                }
              }
            } else {
              mainSection = fullText;
              }
            }
            }
          }
        }
        
        return {
          mainContent: mainSection.trim(),
          abstractContent: abstractSection.trim(),
          referencesList: referenceSection.trim()
        };
      });
      
    // Extract inline links from abstract and content
    const inlineReferences = await page.evaluate(() => {
      const references = [];
      const seenUrls = new Set();
      
      // Find all links in the research result
      const links = document.querySelectorAll('div.deep-research-result a[href^="http"]');
      
      links.forEach(link => {
        const url = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        const context = link.parentElement?.textContent?.trim() || '';
        
        if (!seenUrls.has(url) && !url.includes('chatgpt.com')) {
          seenUrls.add(url);
          references.push({
            url,
            title: text || new URL(url).hostname,
            context: context.substring(0, 200) // First 200 chars of context
          });
        }
      });
      
      return references;
    });
      
    // Extract sources (links)
      const sources = await page.evaluate(() => {
      const sourceLinks: BriefSource[] = []; 
        // sourceLinks is typed as BriefSource[] to ensure it's an array of source objects matching the BriefSource type
        
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
      
    // Add these to the references section
    const enhancedReferences = [
      ...referencesList.split('\n').filter(line => line.trim()).filter((line, index) => {
        // Remove first line if it has less than 4 words
        if (index === 0) {
          const wordCount = line.trim().split(/\s+/).length;
          return wordCount >= 4;
        }
        return true;
      }).map(line => `• ${line.trim()}`),
      ...inlineReferences.map(ref => `• [${ref.title}](${ref.url}) - ${ref.context}`)
    ].join('\n');
    
    // Format references to have bullet points
    const formattedReferences = enhancedReferences || "No references available";
    
      // Get model information if available
      console.info(url)
    const model: "openai" | "perplexity" | "anthropic" | "other" = "openai";
      // model is explicitly typed with a union type to restrict its value to only these specific string literals
      // Using lowercase to match database provider values
      
      // Extract thinking content (this is usually not visible in ChatGPT responses,
      // but we keep this as a placeholder)
      const thinking = "";
      
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
