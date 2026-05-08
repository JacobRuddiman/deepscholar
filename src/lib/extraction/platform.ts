import type { BriefData } from '@/functions/types';

export type SupportedPlatform =
  | 'chatgpt'
  | 'perplexity'
  | 'anthropic'
  | 'google-docs'
  | 'google'
  | 'generic';

export function detectPlatform(url: string): SupportedPlatform {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('chat.openai.com') || lowerUrl.includes('chatgpt.com')) {
    return 'chatgpt';
  }

  if (lowerUrl.includes('perplexity.ai')) {
    return 'perplexity';
  }

  if (lowerUrl.includes('claude.ai') || lowerUrl.includes('anthropic.com')) {
    return 'anthropic';
  }

  if (lowerUrl.includes('docs.google.com') || lowerUrl.includes('drive.google.com/file')) {
    return 'google-docs';
  }

  if (lowerUrl.includes('google.com')) {
    return 'google';
  }

  return 'generic';
}

export function isChatGPTShareUrl(url: string): boolean {
  return detectPlatform(url) === 'chatgpt' && url.includes('/share/');
}

export function isGeminiShareUrl(url: string): boolean {
  return url.toLowerCase().includes('gemini.google.com/share');
}

export function mapPlatformToModel(platform: string): BriefData['model'] {
  switch (platform) {
    case 'chatgpt':
    case 'openai':
      return 'openai';
    case 'perplexity':
      return 'perplexity';
    case 'anthropic':
    case 'claude':
      return 'anthropic';
    default:
      return 'other';
  }
}

export function extractGoogleDocId(url: string): string | null {
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
