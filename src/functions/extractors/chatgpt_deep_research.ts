'use server';

import { BriefData, BriefSource, ConversationTurn } from '../types';
import { ExtractionLogger } from './logger';
import {
  launchBrowser,
  navigateWithRetry,
  validateExtraction
} from './base_extractor';

/**
 * ChatGPT Share Extractor (API-based)
 *
 * Handles extraction from ChatGPT share URLs by using the public API endpoint
 * at /backend-api/share/{shareId}. This is more reliable than DOM scraping
 * because ChatGPT share pages often fail to render in Puppeteer.
 *
 * Supports:
 * - Deep Research reports (widget_state → report_message)
 * - Regular conversation shares (visible assistant messages)
 * - Multi-turn conversations
 */

// ── Types for the ChatGPT Share API response ──────────────────────────────

interface ChatGPTMessageContent {
  content_type: string;
  parts?: (string | Record<string, unknown>)[];
  language?: string;
}

interface ChatGPTMessageAuthor {
  role: 'user' | 'assistant' | 'tool' | 'system';
  name?: string;
}

interface ContentReference {
  type: string;
  title?: string;
  url?: string;
}

interface ChatGPTMessageMetadata {
  is_visually_hidden_from_conversation?: boolean;
  is_redacted?: boolean;
  chatgpt_sdk?: {
    widget_state?: string; // JSON string
  };
}

interface ChatGPTMessage {
  author: ChatGPTMessageAuthor;
  content: ChatGPTMessageContent;
  metadata?: ChatGPTMessageMetadata;
  end_turn?: boolean;
  recipient?: string;
}

interface ChatGPTMappingNode {
  message?: ChatGPTMessage;
  parent?: string;
  children?: string[];
}

interface ChatGPTShareAPIResponse {
  title: string;
  conversation_id: string;
  default_model_slug?: string;
  mapping: Record<string, ChatGPTMappingNode>;
  linear_conversation?: Array<{ message?: ChatGPTMessage }>;
}

// ── Browser-side fetch function (plain JS string to avoid tsx __name issue) ──

const FETCH_SHARE_API_FN = `function(shareId) {
  return fetch('https://chatgpt.com/backend-api/share/' + shareId, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(function(res) {
    if (!res.ok) throw new Error('API returned ' + res.status);
    return res.json();
  });
}`;

// ── Main extraction function ──────────────────────────────────────────────

export async function extractFromChatGPTDeepResearch(
  url: string,
  debugMode: boolean = false
): Promise<BriefData> {
  const logger = new ExtractionLogger('chatgpt-share-api', url);
  const overallStart = Date.now();

  logger.info('START', 'Starting ChatGPT Share API extraction', { url });

  // Extract shareId from URL
  const shareId = extractShareId(url);
  if (!shareId) {
    throw new Error(`Could not extract share ID from URL: ${url}`);
  }
  logger.info('PARSE_URL', `Share ID: ${shareId}`);

  let browser;

  try {
    // Step 1: Launch browser (non-headless for stealth/cookie context)
    browser = await launchBrowser(logger, false);

    // Step 2: Navigate to share page (establishes cookies/session)
    const page = await navigateWithRetry(browser, url, 30000, logger, 3, debugMode);

    // Step 3: Wait briefly for JS to initialize cookies
    logger.info('WAIT', 'Waiting for session context to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Fetch conversation data from API via browser context
    logger.info('API_FETCH', 'Fetching conversation data from share API...');

    const apiData = await page.evaluate(
      `(${FETCH_SHARE_API_FN})("${shareId}")`
    ) as ChatGPTShareAPIResponse;

    if (!apiData || !apiData.mapping) {
      throw new Error('API response missing mapping data');
    }

    logger.info('API_FETCH', `Got API response: title="${apiData.title}", ` +
      `mapping entries: ${Object.keys(apiData.mapping).length}`);

    if (debugMode) {
      await logger.saveJSON(apiData, 'api_response.json');
    }

    // Step 5: Parse the conversation data
    const parsed = parseConversationData(apiData, logger);

    // Step 6: Validate and build BriefData
    const response = parsed.deepResearchReport || parsed.lastAssistantMessage || '';
    const prompt = parsed.firstUserMessage || '';
    const title = apiData.title || 'ChatGPT Conversation';

    // Build abstract from response
    const abstract = extractAbstract(response);

    // Build references text from sources
    const referencesText = parsed.sources.length > 0
      ? formatReferences(parsed.sources)
      : '';

    const validation = await validateExtraction(title, response, abstract, parsed.sources, logger);

    const totalTime = Date.now() - overallStart;
    logger.info('COMPLETE', `Extraction completed in ${(totalTime / 1000).toFixed(2)}s`, {
      confidence: validation.confidence,
      responseLength: response.length,
      sourcesCount: parsed.sources.length,
      turnsCount: parsed.conversationTurns.length,
      isDeepResearch: !!parsed.deepResearchReport
    });

    await logger.saveLogs();
    await browser.close();

    return {
      title,
      response,
      abstract,
      sources: parsed.sources,
      references: referencesText,
      thinking: '',
      prompt,
      model: 'openai',
      rawHtml: '',
      confidence: validation.confidence,
      warnings: validation.warnings,
      conversationTurns: parsed.conversationTurns.length > 0
        ? parsed.conversationTurns
        : undefined,
      selectedTurnIndex: parsed.conversationTurns.length > 0
        ? parsed.conversationTurns.length - 1
        : undefined
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('FATAL', 'Extraction failed', { error: message, stack });

    await logger.saveLogs();

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

// ── Helper: Extract share ID from URL ─────────────────────────────────────

function extractShareId(url: string): string | null {
  // Matches: chatgpt.com/share/{uuid} or chatgpt.com/share/e/{uuid}
  const match = url.match(/\/share\/(?:e\/)?([a-f0-9-]+)/i);
  return match ? match[1] ?? null : null;
}

// ── Helper: Parse conversation data from API response ─────────────────────

interface ParsedConversation {
  firstUserMessage: string;
  lastAssistantMessage: string;
  deepResearchReport: string | null;
  sources: BriefSource[];
  conversationTurns: ConversationTurn[];
}

function parseConversationData(
  data: ChatGPTShareAPIResponse,
  logger: ExtractionLogger
): ParsedConversation {
  const result: ParsedConversation = {
    firstUserMessage: '',
    lastAssistantMessage: '',
    deepResearchReport: null,
    sources: [],
    conversationTurns: []
  };

  // Use linear_conversation if available (ordered), otherwise walk mapping
  const orderedMessages = getOrderedMessages(data);

  logger.info('PARSE', `Processing ${orderedMessages.length} messages`);

  let currentUserMessage = '';
  let turnIndex = 0;

  for (const msg of orderedMessages) {
    if (!msg) continue;

    const role = msg.author?.role;
    const meta = msg.metadata;
    const isHidden = meta?.is_visually_hidden_from_conversation;
    const isRedacted = meta?.is_redacted;

    // Skip hidden/redacted messages
    if (isHidden || isRedacted) continue;

    const parts = msg.content?.parts || [];
    const textContent = parts
      .filter((p): p is string => typeof p === 'string')
      .join('\n');

    // Check for deep research widget_state
    if (meta?.chatgpt_sdk?.widget_state) {
      const report = extractDeepResearchReport(meta.chatgpt_sdk.widget_state, logger);
      if (report) {
        result.deepResearchReport = report.content;
        result.sources = report.sources;
        logger.info('PARSE', `Found deep research report: ${report.content.length} chars, ${report.sources.length} sources`);

        // Create a turn for the deep research report
        if (currentUserMessage) {
          result.conversationTurns.push({
            index: turnIndex++,
            userMessage: currentUserMessage,
            assistantMessage: report.content
          });
        }
        continue;
      }
    }

    if (role === 'user' && textContent.length > 5) {
      currentUserMessage = textContent;
      if (!result.firstUserMessage) {
        result.firstUserMessage = textContent;
      }
      logger.debug('PARSE', `User message: "${textContent.substring(0, 80)}..."`);
    }

    if (role === 'assistant' && textContent.length > 50) {
      result.lastAssistantMessage = textContent;

      // Pair with the current user message as a turn
      if (currentUserMessage) {
        result.conversationTurns.push({
          index: turnIndex++,
          userMessage: currentUserMessage,
          assistantMessage: textContent
        });
        currentUserMessage = ''; // Reset for next turn
      }

      logger.debug('PARSE', `Assistant message: ${textContent.length} chars`);
    }
  }

  logger.info('PARSE', `Parsed: ${result.conversationTurns.length} turns, ` +
    `deepResearch: ${!!result.deepResearchReport}, sources: ${result.sources.length}`);

  return result;
}

// ── Helper: Get ordered messages from API response ────────────────────────

function getOrderedMessages(data: ChatGPTShareAPIResponse): ChatGPTMessage[] {
  // Prefer linear_conversation (already ordered)
  if (data.linear_conversation && data.linear_conversation.length > 0) {
    return data.linear_conversation
      .filter(entry => entry.message != null)
      .map(entry => entry.message!);
  }

  // Fallback: walk the mapping tree from root
  const messages: ChatGPTMessage[] = [];
  const mapping = data.mapping;

  // Find root nodes (no parent or parent not in mapping)
  const roots = Object.entries(mapping).filter(
    ([, node]) => !node.parent || !mapping[node.parent]
  );

  // BFS traversal
  const queue = roots.map(([id]) => id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = mapping[id];
    if (node?.message) {
      messages.push(node.message);
    }

    if (node?.children) {
      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return messages;
}

// ── Helper: Extract deep research report from widget_state ────────────────

interface DeepResearchReport {
  content: string;
  sources: BriefSource[];
}

function extractDeepResearchReport(
  widgetStateStr: string,
  logger: ExtractionLogger
): DeepResearchReport | null {
  try {
    const widgetState = JSON.parse(widgetStateStr) as {
      status?: string;
      report_message?: {
        content?: {
          parts?: string[];
        };
        metadata?: {
          content_references?: ContentReference[];
        };
      };
    };

    const reportMessage = widgetState.report_message;
    if (!reportMessage) {
      logger.debug('DEEP_RESEARCH', 'widget_state has no report_message');
      return null;
    }

    // Extract markdown content
    const parts = reportMessage.content?.parts || [];
    const content = parts
      .filter((p): p is string => typeof p === 'string')
      .join('\n');

    if (!content || content.length < 100) {
      logger.debug('DEEP_RESEARCH', `report_message content too short: ${content.length} chars`);
      return null;
    }

    // Extract sources from content_references
    const sources: BriefSource[] = [];
    const contentRefs = reportMessage.metadata?.content_references || [];

    for (const ref of contentRefs) {
      if (ref.url && (ref.type === 'webpage_extended' || ref.type === 'webpage')) {
        // Avoid duplicates
        if (!sources.some(s => s.url === ref.url)) {
          sources.push({
            title: ref.title || new URL(ref.url).hostname,
            url: ref.url
          });
        }
      }
    }

    logger.info('DEEP_RESEARCH', `Extracted report: ${content.length} chars, ${sources.length} sources`);

    return { content, sources };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('DEEP_RESEARCH', `Failed to parse widget_state: ${message}`);
    return null;
  }
}

// ── Helper: Extract abstract from response ────────────────────────────────

function extractAbstract(response: string): string {
  if (!response) return '';

  // Look for Executive Summary section
  const execSummaryMatch = response.match(
    /#+\s*Executive\s+Summary\s*\n+([\s\S]*?)(?=\n#+\s|\n---|\n\*\*\*|$)/i
  );
  if (execSummaryMatch?.[1]) {
    const summary = execSummaryMatch[1].trim();
    if (summary.length > 50) {
      return summary.length > 1000 ? summary.substring(0, 1000) + '...' : summary;
    }
  }

  // Look for Abstract section
  const abstractMatch = response.match(
    /#+\s*Abstract\s*\n+([\s\S]*?)(?=\n#+\s|\n---|\n\*\*\*|$)/i
  );
  if (abstractMatch?.[1]) {
    const abstract = abstractMatch[1].trim();
    if (abstract.length > 50) {
      return abstract.length > 1000 ? abstract.substring(0, 1000) + '...' : abstract;
    }
  }

  // Fallback: first substantial paragraph
  const paragraphs = response.split(/\n\n+/);
  for (const para of paragraphs) {
    const cleaned = para.replace(/^#+\s+.*$/m, '').trim();
    if (cleaned.length > 100 && !cleaned.startsWith('#')) {
      return cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned;
    }
  }

  return '';
}

// ── Helper: Format references text from sources ───────────────────────────

function formatReferences(sources: BriefSource[]): string {
  if (sources.length === 0) return '';

  const lines = sources.map((source, i) =>
    `${i + 1}. [${source.title}](${source.url})`
  );

  return '## References\n\n' + lines.join('\n');
}
