'use server';

import { BriefData } from '@/functions/types'; 
import { extractFromChatGPT } from '@/functions/extractors/chatgpt';
import { extractFromPerplexity } from '@/functions/extractors/perplexity';
import { extractFromGoogle } from '@/functions/extractors/google';
import { extractFromAnthropic } from '@/functions/extractors/anthropic';
import { extractGeneric } from '@/functions/extractors/generic';

// Main function to extract brief from URL
export async function extractBriefFromUrl(url: string): Promise<BriefData> { // Define parameter type as string for the URL and return type as Promise<BriefData> to ensure type safety and consistent return structure
  const lowerUrl = url.toLowerCase();
  // Determine which extractor to use based on URL
  if (lowerUrl.includes('chat.openai.com') || url.includes?.('chatgpt.com')) {
    console.info('Using openai extractor');
    return extractFromChatGPT(lowerUrl);
  } else if (lowerUrl.includes('perplexity.ai')) {
    console.info('Using perplexity extractor');
    return extractFromPerplexity(lowerUrl);
  } else if (lowerUrl.includes('claude.ai') || lowerUrl.includes('anthropic.com')) {
    console.info('Using anthropic extractor');
    return extractFromAnthropic(lowerUrl);
  } else if (lowerUrl.includes('google.com')) {
    console.info('Using google extractor');
    return extractFromGoogle(lowerUrl);
  } else {
    // Default extractor or generic approach
    console.info('Using generic extractor');
    return extractGeneric(lowerUrl);
  }
}
