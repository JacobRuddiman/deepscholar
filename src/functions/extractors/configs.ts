import { ExtractorConfig } from './extractor_types';

export const CHATGPT_CONFIG: ExtractorConfig = {
  platformName: 'chatgpt',

  contentSelectors: [
    'div.deep-research-result',
    'div.markdown',
    '.prose',
    '[data-message-author-role="assistant"]',
    'article'
  ],

  abstractPatterns: [
    /\b(conclusion|summary|abstract|in summary|to summarize|overall|in conclusion)\b/i,
    /\b(key takeaways?|main points?|findings?)\b/i,
    /\b(final thoughts?|wrap.?up)\b/i
  ],

  referencesPatterns: [
    /\b(references?|sources?|citations?|bibliography)\s*:?\s*$/im,
    /\b(read more|learn more|additional resources?)\b/i,
    /\b(further reading|see also)\b/i
  ],

  promptPatterns: [
    /^(?:question|prompt|query|research question|user):\s*(.+?)$/im
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    '.close-button',
    '[data-testid="close-button"]'
  ],

  waitForSelectors: [
    'div.deep-research-result',
    'div.markdown',
    '[data-message-author-role="assistant"]'
  ],

  navigationTimeout: 30000,
  contentWaitTimeout: 10000
};

export const PERPLEXITY_CONFIG: ExtractorConfig = {
  platformName: 'perplexity',

  contentSelectors: [
    '[id^="markdown-content"]',  // PRIMARY - Main markdown content container (WORKING)
    '#markdown-content',         // Specific ID variant
    '[id*="markdown-content"]',  // Contains variant
    '[data-testid="copilot_answer"]',
    '[data-testid="answer"]',
    '[data-testid="response"]',
    '.answer-content',
    '.md\\:prose',
    '.prose.prose-invert',       // Perplexity dark mode variant
    '[class*="answer"]',
    '[class*="response"]',
    '[class*="markdown"]',
    '.markdown-content',
    '.content-wrapper',
    '[data-testid="thread-content"]',
    '.thread-content',
    'main article',              // Semantic HTML
    'main [role="main"]',
    'article',                   // Generic article
    '.prose'                     // Fallback - catches individual elements
  ],

  abstractPatterns: [
    /\b(conclusion|summary|in summary|to summarize|overall)\b/i,
    /\b(key takeaways?|main points?)\b/i
  ],

  referencesPatterns: [
    /\b(references?|sources?|citations?)\s*:?\s*$/im,
    /\b(read more|learn more)\b/i
  ],

  promptPatterns: [
    /^(?:question|query):\s*(.+?)$/im
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    'button[title="Close"]',
    'button[title="close"]',
    '.close-button',
    '.modal-close',
    '[data-testid="close-button"]',
    '[data-testid="modal-close"]'
  ],

  waitForSelectors: [
    '[id^="markdown-content"]',
    '#markdown-content',
    '[id*="markdown-content"]',
    '[data-testid="copilot_answer"]',
    '[data-testid="answer"]',
    '.answer-content',
    '.prose',
    'article'
  ],

  navigationTimeout: 30000,
  contentWaitTimeout: 5000
};

export const ANTHROPIC_CONFIG: ExtractorConfig = {
  platformName: 'anthropic',

  contentSelectors: [
    '[data-testid="conversation"]',
    '.conversation',
    '.message',
    '.claude-message',
    '.assistant-message',
    '[data-testid="message"]',
    '.prose',
    '.markdown',
    '.content'
  ],

  abstractPatterns: [
    /\b(conclusion|summary|in summary|to summarize|overall|in conclusion)\b/i,
    /\b(key takeaways?|main points?|findings?)\b/i,
    /\b(final thoughts?|wrap.?up)\b/i
  ],

  referencesPatterns: [
    /\b(references?|sources?|citations?|bibliography)\s*:?\s*$/im,
    /\b(read more|learn more|additional resources?)\b/i,
    /\b(further reading|see also)\b/i
  ],

  promptPatterns: [
    /^(?:question|prompt|query|user):\s*(.+?)$/im
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    '.close-button',
    '[data-testid="close-button"]'
  ],

  waitForSelectors: [
    '[data-testid="conversation"]',
    '.conversation',
    '.message'
  ],

  navigationTimeout: 60000,  // Longer for Cloudflare
  contentWaitTimeout: 15000,

  requiresCloudflareBypass: true
};

export const GOOGLE_CONFIG: ExtractorConfig = {
  platformName: 'google',

  contentSelectors: [
    '#search',
    '.g',
    '[data-sokoban-container]',
    'main',
    'article'
  ],

  abstractPatterns: [
    /\b(summary|overview)\b/i
  ],

  referencesPatterns: [
    /\b(sources?|related)\b/i
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    '.close'
  ],

  waitForSelectors: [
    '#search',
    '.g'
  ],

  navigationTimeout: 20000,
  contentWaitTimeout: 5000
};

export const GOOGLE_DOCS_CONFIG: ExtractorConfig = {
  platformName: 'google-docs',

  contentSelectors: [
    '.kix-paginateddocumentplugin',  // Main document container
    '.kix-page',                      // Individual pages
    '[role="document"]',
    '.doc-content',
    'body'
  ],

  abstractPatterns: [
    /\n\s*(?:Conclusion|Summary|Abstract|Key Takeaways|In Conclusion)\s*\n/i,
    /\n\s*(?:Conclusion|Summary)\s*[:]/i
  ],

  referencesPatterns: [
    /\n\s*(?:References|Sources|Citations|Bibliography)\s*[:]/i,
    /\n\s*(?:References|Sources)\s*\n/i
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    '[data-dismiss="modal"]'
  ],

  waitForSelectors: [
    '.kix-paginateddocumentplugin',
    '[role="document"]',
    'body'
  ],

  navigationTimeout: 30000,
  contentWaitTimeout: 5000
};

export const GENERIC_CONFIG: ExtractorConfig = {
  platformName: 'generic',

  contentSelectors: [
    'article',
    'main',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.article-content',
    'body'
  ],

  abstractPatterns: [
    /\b(conclusion|summary|abstract)\b/i
  ],

  referencesPatterns: [
    /\b(references?|sources?)\b/i
  ],

  modalCloseSelectors: [
    'button[aria-label="Close"]',
    '.modal-close',
    '.close'
  ],

  waitForSelectors: [
    'article',
    'main',
    'body'
  ],

  navigationTimeout: 30000,
  contentWaitTimeout: 5000
};

// Helper to get config by platform name
export function getConfigForPlatform(platform: string): ExtractorConfig {
  const configs: Record<string, ExtractorConfig> = {
    'chatgpt': CHATGPT_CONFIG,
    'openai': CHATGPT_CONFIG,
    'perplexity': PERPLEXITY_CONFIG,
    'anthropic': ANTHROPIC_CONFIG,
    'claude': ANTHROPIC_CONFIG,
    'google': GOOGLE_CONFIG,
    'google-docs': GOOGLE_DOCS_CONFIG,
    'docs': GOOGLE_DOCS_CONFIG,
    'generic': GENERIC_CONFIG
  };

  return configs[platform.toLowerCase()] || GENERIC_CONFIG;
}
