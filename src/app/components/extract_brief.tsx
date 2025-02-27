'use server';

import * as cheerio from 'cheerio';

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
  sources: BriefSource[];
  thinking: string;
  model: "OpenAI" | "Perplexity" | "Anthropic" | "Other";
  rawHtml?: string; // Add this for debugging purposes
};

export async function extractBriefFromUrl(url: string): Promise<BriefData> {
  try {
    // Make the request to the OpenAI share link
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Ensure we get fresh content
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Use cheerio to parse the HTML
    const $ = cheerio.load(html);
    
    // Extract relevant data - initial placeholders that we'll refine after examining the actual HTML
    const title = $('title').text().replace(' - ChatGPT', '') || "Untitled Chat";
    
    // This will need refinement after we see the actual HTML structure
    const contentElements = $('.markdown').toArray();
    const content = contentElements.length > 0 
      ? contentElements.map(el => $(el).text()).join('\n\n')
      : "No content found";
    
    // Determine model based on URL
    let model: BriefData['model'] = "Other";
    if (url.includes('chatgpt.com')) {
      model = "OpenAI";
    } else if (url.includes('perplexity.ai')) {
      model = "Perplexity";
    } else if (url.includes('claude.ai')) {
      model = "Anthropic";
    }
    
    // Extract sources if any
    const sources: BriefSource[] = [];
    $('a[href^="http"]').each((_, element) => {
      const sourceUrl = $(element).attr('href') || "";
      const sourceTitle = $(element).text() || new URL(sourceUrl).hostname;
      
      // Deduplicate sources
      if (sourceUrl && !sources.some(s => s.url === sourceUrl)) {
        sources.push({
          title: sourceTitle,
          url: sourceUrl
        });
      }
    });
    
    // Extract any "thinking" content if available
    // This is a placeholder that will need refinement
    const thinking = $('.thinking-section').text() || "";
    
    return {
      title,
      content,
      sources,
      thinking,
      model,
      rawHtml: html // Include the raw HTML for inspection
    };
  } catch (error) {
    console.error("Error extracting brief:", error);
    throw new Error("Failed to extract brief information from the URL");
  }
}