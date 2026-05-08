// @ts-nocheck - Parser utility with extensive regex match group accesses that are safe in context
/**
 * Content Parser for Brief Data
 *
 * Parses raw extracted content into structured Brief fields:
 * - title: Main heading
 * - prompt: Original user question
 * - response: Main content body (excluding abstract, references, thinking)
 * - abstract: Summary/conclusion section
 * - thinking: AI reasoning process
 * - references: Citations/bibliography text
 * - sources: Parsed citation objects
 */

import parsingPatterns from './parsing_patterns.json';
import { BriefData, BriefSource } from '../types';

export interface ParsedContent {
  title: string;
  prompt: string;
  response: string;
  abstract: string;
  thinking: string;
  references: string;
  sources: BriefSource[];

  // Metadata about parsing
  parsedSections: string[];  // Which sections were successfully identified
  warnings: string[];
}

export interface ParserConfig {
  preserveMarkdown?: boolean;  // Keep markdown formatting
  extractSources?: boolean;    // Parse sources from references
  minContentLength?: number;   // Minimum length for content to be valid
  maxAbstractLength?: number;  // Maximum length for abstract
}

const DEFAULT_CONFIG: ParserConfig = {
  preserveMarkdown: true,
  extractSources: true,
  minContentLength: 50,
  maxAbstractLength: 5000
};

/**
 * Main parsing function
 */
export function parseContent(
  rawContent: string,
  title?: string,
  config: ParserConfig = DEFAULT_CONFIG
): ParsedContent {
  const warnings: string[] = [];
  const parsedSections: string[] = [];

  // Handle undefined or null content
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      title: title || 'Untitled',
      prompt: '',
      response: '',
      abstract: '',
      thinking: '',
      references: '',
      sources: [],
      parsedSections: [],
      warnings: ['No content provided to parse']
    };
  }

  // Step 1: Extract title
  const extractedTitle = title || extractTitle(rawContent);
  if (!extractedTitle) {
    warnings.push('No title found');
  } else {
    parsedSections.push('title');
  }

  // Step 2: Extract prompt (user's original question)
  const { content: contentAfterPrompt, prompt } = extractPrompt(rawContent);
  if (prompt) {
    parsedSections.push('prompt');
  }

  // Step 3: Extract thinking section
  const { content: contentAfterThinking, thinking } = extractThinking(contentAfterPrompt);
  if (thinking) {
    parsedSections.push('thinking');
  }

  // Step 4: Extract references section
  const { content: contentAfterRefs, references } = extractReferences(contentAfterThinking);
  if (references) {
    parsedSections.push('references');
  }

  // Step 5: Extract abstract/conclusion
  const { content: mainContent, abstract } = extractAbstract(contentAfterRefs);
  if (abstract) {
    parsedSections.push('abstract');

    if (abstract.length > (config.maxAbstractLength || 5000)) {
      warnings.push(`Abstract is very long (${abstract.length} chars) - might be misidentified`);
    }
  }

  // Step 6: Validate main content
  const cleanContent = cleanupContent(mainContent);
  if (cleanContent.length < (config.minContentLength || 50)) {
    warnings.push(`Main content is very short (${cleanContent.length} chars)`);
  }

  // Step 7: Parse sources from references
  let sources: BriefSource[] = [];
  if (config.extractSources && references) {
    sources = parseSources(references);
    if (sources.length > 0) {
      parsedSections.push('sources');
    }
  }

  return {
    title: extractedTitle || 'Untitled',
    prompt: prompt || '',
    response: cleanContent,
    abstract: abstract || '',
    thinking: thinking || '',
    references: references || '',
    sources,
    parsedSections,
    warnings
  };
}

/**
 * Extract title from content
 */
function extractTitle(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Try to find first heading
  const lines = content.split('\n');

  // Look for markdown headings
  for (const line of lines.slice(0, 10)) {  // Check first 10 lines
    const trimmed = line.trim();

    // # Heading
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      return h1Match[1]!.trim();
    }

    // Underlined heading
    if (trimmed.length > 0 && trimmed.length < 100) {
      const nextLineIdx = lines.indexOf(line) + 1;
      if (nextLineIdx < lines.length) {
        const nextLine = lines[nextLineIdx]!.trim();
        if (/^[=-]{3,}$/.test(nextLine)) {
          return trimmed;
        }
      }
    }

    // First non-empty line that's not too long
    if (trimmed.length > 0 && trimmed.length < 100 && !trimmed.endsWith(':')) {
      return trimmed;
    }
  }

  return '';
}

/**
 * Extract prompt/question section
 */
function extractPrompt(content: string): { content: string; prompt: string } {
  if (!content || typeof content !== 'string') {
    return { content: '', prompt: '' };
  }

  const promptHeaders = parsingPatterns.sections.prompt.headers;

  // Check for prompt headers
  for (const header of promptHeaders) {
    const headerRegex = new RegExp(`^${escapeRegExp(header)}\\s*(.+?)$`, 'im');
    const match = content.match(headerRegex);

    if (match) {
      const prompt = match[1].trim();
      // Remove the prompt line from content
      const remaining = content.replace(match[0], '').trim();
      return { content: remaining, prompt };
    }
  }

  // Try pattern-based extraction
  const patternMatch = content.match(/^(?:Question|Prompt|Query|User|You said):\s*(.+?)(?:\n\n|\n[A-Z])/im);
  if (patternMatch) {
    const prompt = patternMatch[1].trim();
    const remaining = content.substring(content.indexOf(patternMatch[0]) + patternMatch[0].length).trim();
    return { content: remaining, prompt };
  }

  return { content, prompt: '' };
}

/**
 * Extract thinking section
 */
function extractThinking(content: string): { content: string; thinking: string } {
  const thinkingHeaders = parsingPatterns.sections.thinking.headers;

  for (const header of thinkingHeaders) {
    // Case-insensitive search
    const headerRegex = new RegExp(escapeRegExp(header), 'i');
    const match = content.match(headerRegex);

    if (match && match.index !== undefined) {
      const headerPos = match.index;
      const headerEnd = headerPos + match[0].length;

      // Skip any colons or whitespace after header
      let contentStart = headerEnd;
      while (contentStart < content.length && /[:)\s]/.test(content[contentStart])) {
        contentStart++;
      }

      const afterHeader = content.substring(contentStart);

      // Look for next section marker (start looking after first line to avoid matching header itself)
      const firstLineEnd = afterHeader.indexOf('\n');
      const searchStart = firstLineEnd !== -1 ? firstLineEnd : 0;

      // Find next heading (markdown or major section)
      const nextHeadingRegex = /\n#{1,6}\s+[A-Z]/;  // Markdown heading
      const nextHeadingMatch = afterHeader.substring(searchStart).match(nextHeadingRegex);

      let sectionEnd = -1;
      if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
        sectionEnd = searchStart + nextHeadingMatch.index;
      } else {
        // Try finding next major section
        sectionEnd = findNextSectionMarker(afterHeader, searchStart);
      }

      if (sectionEnd !== -1) {
        const thinking = afterHeader.substring(0, sectionEnd).trim();
        const remaining = content.substring(0, headerPos) + '\n' + afterHeader.substring(sectionEnd);
        return { content: remaining.trim(), thinking };
      } else {
        // Thinking goes to end
        const thinking = afterHeader.trim();
        const remaining = content.substring(0, headerPos).trim();
        return { content: remaining, thinking };
      }
    }
  }

  return { content, thinking: '' };
}

/**
 * Extract abstract/summary/conclusion section
 */
function extractAbstract(content: string): { content: string; abstract: string } {
  const abstractHeaders = parsingPatterns.sections.abstract.headers;

  for (const header of abstractHeaders) {
    // Try multiple patterns:
    // 1. Markdown heading: ## Summary
    // 2. Plain text with newlines: \nSummary\n
    // 3. With colon: Summary:
    // 4. Inline with colon: "Bottom Line: text continues..."
    const patterns = [
      new RegExp(`\\n#{1,6}\\s*${escapeRegExp(header)}\\s*\\n`, 'i'),  // Markdown heading
      new RegExp(`\\n\\s*${escapeRegExp(header)}\\s*[:)]?\\s*\\n`, 'i'),  // Plain text standalone
      new RegExp(`^${escapeRegExp(header)}\\s*[:)]?\\s*\\n`, 'im'),  // Start of text
      new RegExp(`\\n${escapeRegExp(header)}:\\s+(.+)`, 'i')  // Inline: "Bottom Line: text..."
    ];

    for (let i = 0; i < patterns.length; i++) {
      const headerRegex = patterns[i];
      const match = content.match(headerRegex);

      if (match && match.index !== undefined) {
        // For inline pattern (pattern 4), the abstract is captured in group 1
        if (i === 3 && match[1]) {
          // Inline case: extract rest of paragraph/document
          const beforeAbstract = content.substring(0, match.index);
          const abstractStart = match.index + match[0].indexOf(':') + 1;  // Start after the colon
          const afterColon = content.substring(abstractStart).trim();

          return { content: beforeAbstract.trim(), abstract: afterColon };
        } else {
          // Regular section header case
          const startPos = match.index + match[0].length;
          const beforeAbstract = content.substring(0, match.index);
          const afterHeader = content.substring(startPos);

          // Find where abstract ends (next section or end)
          const sectionEnd = findNextSectionMarker(afterHeader);

          if (sectionEnd !== -1) {
            const abstract = afterHeader.substring(0, sectionEnd).trim();
            return { content: beforeAbstract.trim(), abstract };
          } else {
            // Abstract goes to end
            return { content: beforeAbstract.trim(), abstract: afterHeader.trim() };
          }
        }
      }
    }
  }

  return { content, abstract: '' };
}

/**
 * Extract references section
 */
function extractReferences(content: string): { content: string; references: string } {
  const refHeaders = parsingPatterns.sections.references.headers;

  for (const header of refHeaders) {
    // Try multiple patterns for markdown and plain text
    const patterns = [
      new RegExp(`\\n#{1,6}\\s*${escapeRegExp(header)}\\s*\\n`, 'i'),  // Markdown heading
      new RegExp(`\\n\\s*${escapeRegExp(header)}\\s*[:)]?\\s*\\n`, 'i'),  // Plain text
      new RegExp(`^${escapeRegExp(header)}\\s*[:)]?\\s*\\n`, 'im')  // Start of text
    ];

    for (const headerRegex of patterns) {
      const match = content.match(headerRegex);

      if (match && match.index !== undefined) {
        const beforeRefs = content.substring(0, match.index);
        const afterHeader = content.substring(match.index + match[0].length);

        return { content: beforeRefs.trim(), references: afterHeader.trim() };
      }
    }
  }

  return { content, references: '' };
}

/**
 * Find next section marker in content
 */
function findNextSectionMarker(content: string, startOffset: number = 0): number {
  const allHeaders = [
    ...parsingPatterns.sections.abstract.headers,
    ...parsingPatterns.sections.references.headers,
    ...parsingPatterns.sections.methodology.headers,
    ...parsingPatterns.sections.discussion.headers
  ];

  let earliestPos = -1;

  for (const header of allHeaders) {
    // Check both markdown headings and plain text
    const patterns = [
      new RegExp(`\\n#{1,6}\\s*${escapeRegExp(header)}\\s*\\n`, 'i'),  // Markdown
      new RegExp(`\\n\\s*${escapeRegExp(header)}\\s*[:)]?\\s*\\n`, 'i')  // Plain text
    ];

    for (const regex of patterns) {
      const match = content.substring(startOffset).match(regex);

      if (match && match.index !== undefined) {
        const pos = startOffset + match.index;
        if (earliestPos === -1 || pos < earliestPos) {
          earliestPos = pos;
        }
      }
    }
  }

  return earliestPos;
}

/**
 * Parse sources from references section
 */
function parseSources(referencesText: string): BriefSource[] {
  const sources: BriefSource[] = [];
  const seenUrls = new Set<string>();

  // Try markdown links: [title](url)
  const markdownLinks = referencesText.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of markdownLinks) {
    const title = match[1].trim();
    const url = match[2].trim();

    if (!seenUrls.has(url) && isValidUrl(url)) {
      sources.push({ title, url });
      seenUrls.add(url);
    }
  }

  // Try numbered citations: 1. Title - URL or 1. Title URL
  const numberedCitations = referencesText.matchAll(/^\s*\d+\.\s*(.+?)(?:\s*-\s*|\s+)(https?:\/\/[^\s)]+)/gm);
  for (const match of numberedCitations) {
    const title = match[1].trim();
    const url = match[2].trim();

    if (!seenUrls.has(url) && isValidUrl(url)) {
      sources.push({ title, url });
      seenUrls.add(url);
    }
  }

  // Try bullet citations: - **Title**: Description - URL
  const bulletCitations = referencesText.matchAll(/^\s*[-*•]\s*\*\*([^*]+)\*\*[:\s]*(.+?)(?:\s*-\s*|\s+)(https?:\/\/[^\s)]+)/gm);
  for (const match of bulletCitations) {
    const title = match[1].trim();
    const url = match[3].trim();

    if (!seenUrls.has(url) && isValidUrl(url)) {
      sources.push({ title, url });
      seenUrls.add(url);
    }
  }

  // Fallback: extract all URLs and use domain as title
  const allUrls = referencesText.matchAll(/https?:\/\/[^\s)\"'>]+/g);
  for (const match of allUrls) {
    const url = match[0].trim();

    if (!seenUrls.has(url) && isValidUrl(url)) {
      const domain = extractDomain(url);
      sources.push({ title: domain, url });
      seenUrls.add(url);
    }
  }

  return sources;
}

/**
 * Clean up content - remove extra whitespace, HTML, etc.
 */
function cleanupContent(content: string): string {
  let cleaned = content;

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove script/style tags
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // Max 2 consecutive newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' ');     // Normalize spaces

  // Trim each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  return cleaned.trim();
}

/**
 * Helper: Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper: Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Helper: Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Convert BriefData to Brief database format
 */
export function toBriefFormat(parsed: ParsedContent): Partial<BriefData> {
  return {
    title: parsed.title,
    response: parsed.response,
    abstract: parsed.abstract,
    prompt: parsed.prompt,
    thinking: parsed.thinking,
    sources: parsed.sources,
    // references stored separately in DB
    references: parsed.references
  };
}
