/**
 * Conversation Turn Detection
 * Extracts all prompt-response pairs from AI conversations
 * Different providers structure conversations differently
 */

import { Page } from 'puppeteer';
import { ConversationTurn } from '../types';

/**
 * Detect and extract all conversation turns for ChatGPT
 * ChatGPT has clear message roles: user and assistant
 * Special handling for deep research results
 */
export async function extractChatGPTConversation(page: Page): Promise<ConversationTurn[]> {
  return await page.evaluate(() => {
    const turns: ConversationTurn[] = [];

    // Find all messages in order
    const messages = Array.from(document.querySelectorAll('[data-message-author-role]'));

    let currentUserMessage = '';
    let turnIndex = 0;

    for (const message of messages) {
      const role = message.getAttribute('data-message-author-role');

      // For assistant messages, check if there's a deep research result
      let content = '';
      if (role === 'assistant') {
        // Check for deep research result first
        const deepResearchResult = message.querySelector('.deep-research-result');
        if (deepResearchResult) {
          // Use the deep research content
          content = deepResearchResult.textContent?.trim() || '';
          console.log('[ConversationDetector] Found deep research result:', content.length, 'chars');
        } else {
          // Regular assistant message
          content = message.textContent?.trim() || '';
        }
      } else {
        content = message.textContent?.trim() || '';
      }

      if (role === 'user') {
        currentUserMessage = content;
      } else if (role === 'assistant' && currentUserMessage) {
        // Skip very short assistant messages (like "I'll research...") if they don't have substantial content
        // unless they're the only content available
        if (content.length > 100 || !content.toLowerCase().includes('research')) {
          turns.push({
            index: turnIndex++,
            userMessage: currentUserMessage,
            assistantMessage: content
          });
          currentUserMessage = ''; // Reset for next turn
        } else {
          console.log('[ConversationDetector] Skipping short intro message:', content.substring(0, 50));
        }
      }
    }

    return turns;
  });
}

/**
 * Detect and extract conversation for Perplexity
 * Supports both single-turn and multi-turn conversations
 */
export async function extractPerplexityConversation(page: Page): Promise<ConversationTurn[]> {
  return await page.evaluate(() => {
    const turns: ConversationTurn[] = [];

    // Perplexity stores queries in <span class="select-text"> elements
    // and answers in <div id="markdown-content-X"> elements
    const queryElements = Array.from(document.querySelectorAll('span.select-text'));
    const answerElements = Array.from(document.querySelectorAll('[id^="markdown-content"]'));

    console.log('[PerplexityDetector] Found', queryElements.length, 'query elements');
    console.log('[PerplexityDetector] Found', answerElements.length, 'answer elements');

    // Pair queries with answers
    const minLength = Math.min(queryElements.length, answerElements.length);

    for (let i = 0; i < minLength; i++) {
      const query = queryElements[i]!;
      const answer = answerElements[i]!;

      const userMessage = query.textContent?.trim() || '';
      const assistantMessage = answer.textContent?.trim() || '';

      // Only include turns with substantial content
      if (userMessage.length > 10 && assistantMessage.length > 100) {
        turns.push({
          index: i,
          userMessage,
          assistantMessage
        });
        console.log('[PerplexityDetector] Turn', i + 1, '- Query:', userMessage.length, 'chars, Answer:', assistantMessage.length, 'chars');
      }
    }

    // If no turns found using the new method, fall back to old method
    if (turns.length === 0) {
      console.log('[PerplexityDetector] No turns detected with new method, trying fallback');

      // Fallback to page title for query
      const userMessage = document.title || '';

      // Find first answer
      const answerElement = document.querySelector('[id^="markdown-content"]');
      const assistantMessage = answerElement?.textContent?.trim() || '';

      if (userMessage && assistantMessage && assistantMessage.length > 100) {
        turns.push({
          index: 0,
          userMessage,
          assistantMessage
        });
      }
    }

    console.log('[PerplexityDetector] Total turns detected:', turns.length);
    return turns;
  });
}

/**
 * Detect and extract conversation for Claude/Anthropic
 * Similar structure to ChatGPT with conversation messages
 */
export async function extractAnthropicConversation(page: Page): Promise<ConversationTurn[]> {
  return await page.evaluate(() => {
    const turns: ConversationTurn[] = [];

    // Find conversation container
    const messages = Array.from(document.querySelectorAll('.message, [data-testid="message"]'));

    let currentUserMessage = '';
    let turnIndex = 0;

    for (const message of messages) {
      const isUser = message.classList.contains('user-message') ||
                     message.querySelector('.user')  ||
                     message.getAttribute('data-role') === 'user';

      const content = message.textContent?.trim() || '';

      if (isUser) {
        currentUserMessage = content;
      } else if (currentUserMessage) {
        turns.push({
          index: turnIndex++,
          userMessage: currentUserMessage,
          assistantMessage: content
        });
        currentUserMessage = '';
      }
    }

    return turns;
  });
}

/**
 * Detect and extract conversation for Google Docs exports
 * Usually a single exported response
 */
export async function extractGoogleDocsConversation(page: Page): Promise<ConversationTurn[]> {
  return await page.evaluate(() => {
    const turns: ConversationTurn[] = [];

    // Google Docs exports are typically single-turn
    const content = document.body.textContent?.trim() || '';
    const title = document.title;

    if (content) {
      turns.push({
        index: 0,
        userMessage: title || 'Exported conversation',
        assistantMessage: content
      });
    }

    return turns;
  });
}

/**
 * Main conversation detector - routes to provider-specific logic
 */
export async function detectConversationTurns(
  page: Page,
  platform: string
): Promise<ConversationTurn[]> {
  let turns: ConversationTurn[] = [];

  try {
    switch (platform) {
      case 'chatgpt':
      case 'openai':
        turns = await extractChatGPTConversation(page);
        break;

      case 'perplexity':
        turns = await extractPerplexityConversation(page);
        break;

      case 'anthropic':
      case 'claude':
        turns = await extractAnthropicConversation(page);
        break;

      case 'google-docs':
        turns = await extractGoogleDocsConversation(page);
        break;

      default:
        // Generic fallback - try to find any message structure
        turns = await extractChatGPTConversation(page);
        if (turns.length === 0) {
          turns = await extractPerplexityConversation(page);
        }
    }

    return turns;
  } catch (error) {
    console.error('[ConversationDetector] Error detecting turns:', error);
    return [];
  }
}

/**
 * Check if a conversation has multiple meaningful turns
 * A "meaningful" turn has both a user message and assistant response
 */
export function hasMultipleTurns(turns: ConversationTurn[]): boolean {
  const meaningfulTurns = turns.filter(
    turn => turn.userMessage.length > 5 && turn.assistantMessage.length > 50
  );
  return meaningfulTurns.length > 1;
}

/**
 * Get a preview of a turn's content for display in selector
 */
export function getTurnPreview(turn: ConversationTurn, maxLength: number = 100): string {
  const preview = turn.userMessage.length > maxLength
    ? turn.userMessage.substring(0, maxLength) + '...'
    : turn.userMessage;
  return preview;
}
