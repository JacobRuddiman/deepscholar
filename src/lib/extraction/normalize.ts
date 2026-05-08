import { parseContent } from '@/functions/parsers/content_parser';
import type { BriefData, BriefSource } from '@/functions/types';
import { mapPlatformToModel } from './platform';

interface NormalizeOptions {
  platform?: string;
  autoSelectSingleTurn?: boolean;
  /** Skip parseContent re-parsing when the extractor already returns structured fields */
  skipContentParsing?: boolean;
}

function dedupeWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function mergeSources(
  primarySources: BriefSource[] = [],
  secondarySources: BriefSource[] = []
): BriefSource[] {
  const seen = new Set<string>();
  const merged: BriefSource[] = [];

  for (const source of [...primarySources, ...secondarySources]) {
    if (!source?.url) {
      continue;
    }

    if (seen.has(source.url)) {
      continue;
    }

    seen.add(source.url);
    merged.push(source);
  }

  return merged;
}

export function filterSourcesForText(
  sources: BriefSource[] = [],
  text: string
): BriefSource[] {
  const haystack = text.toLowerCase();

  return sources.filter((source) => {
    const domain = extractDomain(source.url);
    return (
      haystack.includes(source.url.toLowerCase()) ||
      haystack.includes(domain) ||
      haystack.includes(source.title.toLowerCase())
    );
  });
}

export function normalizeExtractedBriefData(
  extracted: BriefData,
  options: NormalizeOptions = {}
): BriefData {
  // When the extractor already returns structured fields (e.g. ChatGPT API extractor),
  // skip destructive re-parsing that can misidentify headings like "Executive Summary"
  // as abstract sections, destroying the response content.
  if (options.skipContentParsing) {
    const normalized: BriefData = {
      ...extracted,
      model: options.platform ? mapPlatformToModel(options.platform) : extracted.model,
      warnings: dedupeWarnings(extracted.warnings || []),
    };

    if (options.autoSelectSingleTurn !== false && normalized.conversationTurns?.length === 1) {
      return applySelectedConversationTurn(normalized, 0);
    }

    return normalized;
  }

  const parsed = parseContent(extracted.response, extracted.title, {
    preserveMarkdown: true,
    extractSources: true,
    minContentLength: 50,
  });

  const normalized: BriefData = {
    ...extracted,
    title: parsed.title || extracted.title,
    response: parsed.response,
    abstract: parsed.abstract || extracted.abstract || '',
    thinking: parsed.thinking || extracted.thinking || '',
    prompt: parsed.prompt || extracted.prompt || '',
    references: parsed.references || extracted.references || '',
    sources: mergeSources(extracted.sources, parsed.sources),
    model: options.platform ? mapPlatformToModel(options.platform) : extracted.model,
    warnings: dedupeWarnings([...(extracted.warnings || []), ...parsed.warnings]),
  };

  if (options.autoSelectSingleTurn !== false && normalized.conversationTurns?.length === 1) {
    return applySelectedConversationTurn(normalized, 0);
  }

  return normalized;
}

export function applySelectedConversationTurn(
  briefData: BriefData,
  turnIndex: number
): BriefData {
  const selectedTurn = briefData.conversationTurns?.[turnIndex];
  if (!selectedTurn) {
    return briefData;
  }

  const relevantSources = filterSourcesForText(
    briefData.sources,
    `${selectedTurn.userMessage}\n\n${selectedTurn.assistantMessage}\n\n${briefData.references || ''}`
  );

  const reparsed = normalizeExtractedBriefData(
    {
      ...briefData,
      prompt: selectedTurn.userMessage,
      response: selectedTurn.assistantMessage,
      abstract: '',
      thinking: '',
      references: '',
      sources: relevantSources,
      selectedTurnIndex: turnIndex,
    },
    { autoSelectSingleTurn: false }
  );

  return {
    ...reparsed,
    prompt: selectedTurn.userMessage,
    conversationTurns: briefData.conversationTurns,
    selectedTurnIndex: turnIndex,
  };
}
