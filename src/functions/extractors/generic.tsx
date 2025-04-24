'use server';

import puppeteer from 'puppeteer';
import { BriefData, BriefSource } from '../types';

// Generic extractor for other sources
export async function extractGeneric(url: string): Promise<BriefData> {
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
    
    // Extract the title from the page
    const title = await page.title();
    
    // Extract the main content
    const mainContent = await page.evaluate(() => {
      // Try to find the main content
      const article = document.querySelector('article') || 
                      document.querySelector('main') || 
                      document.querySelector('.content') ||
                      document.querySelector('.article');
      
      if (article) {
        return article.textContent || '';
      }
      
      // Fallback to body content
      return document.body.textContent || '';
    });
    
    // Extract links as sources
    const sources = await page.evaluate(() => {
      const sourceLinks: BriefSource[] = [];
      // sourceLinks is typed as BriefSource[] to ensure it's an array of source objects matching the BriefSource type
      const links = Array.from(document.querySelectorAll('a[href^="http"]'));
      
      links.forEach(link => {
        const url = link.getAttribute('href') || '';
        const title = link.textContent?.trim() || new URL(url).hostname;
        
        // Skip duplicates and empty links
        if (url && !sourceLinks.some(s => s.url === url)) {
          sourceLinks.push({ title, url });
        }
      });
      
      return sourceLinks;
    });
    
    return {
      title,
      content: mainContent || "No content could be extracted",
      abstract: "No summary available",
      sources,
      references: "No references available",
      thinking: "",
      model: "Other",
      rawHtml: await page.content()
    };
  } finally {
    // Always close the browser to prevent resource leaks
    await browser.close();
  }
}