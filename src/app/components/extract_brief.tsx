'use server';

import { BriefData } from '@/functions/types'; 
import { extractFromChatGPT } from '@/functions/extractors/chatgpt';
import { extractFromPerplexity } from '@/functions/extractors/perplexity';
import { extractFromGoogle } from '@/functions/extractors/google';
import { extractGeneric } from '@/functions/extractors/generic';

// Main function to extract brief from URL
export async function extractBriefFromUrl(url: string): Promise<BriefData> { // Define parameter type as string for the URL and return type as Promise<BriefData> to ensure type safety and consistent return structure
  // Determine which extractor to use based on URL
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    return extractFromChatGPT(url);
  } else if (url.includes('perplexity.ai')) {
    return extractFromPerplexity(url);
  } else if (url.includes('google.com')) {
    return extractFromGoogle(url);
  } else {
    // Default extractor or generic approach
    return extractGeneric(url);
  }
}