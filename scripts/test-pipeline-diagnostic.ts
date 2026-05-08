/**
 * Full Pipeline Diagnostic
 *
 * Traces a URL through every stage of the extraction pipeline and shows
 * exactly what data ends up where — from raw HTML to DB-ready Brief fields.
 *
 * Stages:
 *   1. Raw Extraction  (Puppeteer → ExtractionResult)
 *   2. Content Parsing  (parseContent → ParsedContent)
 *   3. Normalization     (normalizeExtractedBriefData → BriefData)
 *   4. DB Field Mapping  (BriefData → CreateBriefInput / Prisma Brief)
 *
 * Usage:
 *   npx tsx scripts/test-pipeline-diagnostic.ts <url>
 *   npx tsx scripts/test-pipeline-diagnostic.ts <url> --debug
 */

import { extractWithLogging } from '../src/functions/extractors/unified_extractor';
import { getConfigForPlatform } from '../src/functions/extractors/configs';
import { parseContent, ParsedContent } from '../src/functions/parsers/content_parser';
import { normalizeExtractedBriefData } from '../src/lib/extraction/normalize';
import { detectPlatform, mapPlatformToModel } from '../src/lib/extraction/platform';
import type { ExtractionResult } from '../src/functions/extractors/extractor_types';
import type { BriefData } from '../src/functions/types';
import * as fs from 'fs';
import * as path from 'path';

// ── Helpers ─────────────────────────────────────────────────────────────────

function preview(s: string | undefined | null, len: number = 200): string {
  if (!s) return '(empty)';
  const clean = s.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.substring(0, len) + '...' : clean;
}

function len(s: string | undefined | null): number {
  return s?.length ?? 0;
}

function check(v: string | undefined | null): string {
  if (!v || v.length === 0) return 'MISSING';
  if (v.length < 20) return `SHORT (${v.length})`;
  return `OK (${v.length.toLocaleString()})`;
}

function sourcesSummary(sources: { title: string; url: string }[]): string {
  if (sources.length === 0) return '(none)';
  const first3 = sources.slice(0, 3).map(s => s.title || new URL(s.url).hostname).join(', ');
  return sources.length <= 3 ? first3 : `${first3} (+${sources.length - 3} more)`;
}

function hr(char: string = '─', width: number = 90): string {
  return char.repeat(width);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const url = args.find(a => !a.startsWith('--'));
  const debug = args.includes('--debug');

  if (!url) {
    console.error('Usage: npx tsx scripts/test-pipeline-diagnostic.ts <url> [--debug]');
    process.exit(1);
  }

  try { new URL(url); } catch { console.error(`Invalid URL: ${url}`); process.exit(1); }

  const platform = detectPlatform(url);
  const model = mapPlatformToModel(platform);

  console.log(`\n${hr('═')}`);
  console.log('  FULL PIPELINE DIAGNOSTIC');
  console.log(hr('═'));
  console.log(`  URL:       ${url}`);
  console.log(`  Platform:  ${platform}`);
  console.log(`  Model:     ${model}`);
  console.log(hr('═'));

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 1: Raw Extraction
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${hr('━')}`);
  console.log('  STAGE 1: RAW EXTRACTION (Puppeteer + Stealth)');
  console.log(hr('━'));

  const config = getConfigForPlatform(platform);
  if (debug) config.debugMode = true;

  const extractStart = Date.now();
  const extracted: ExtractionResult = await extractWithLogging(url, config);
  const extractTime = Date.now() - extractStart;

  console.log(`\n  Time:            ${(extractTime / 1000).toFixed(2)}s`);
  console.log(`  Title:           ${preview(extracted.title, 80)}`);
  console.log(`  Response:        ${len(extracted.response).toLocaleString()} chars`);
  console.log(`  Abstract:        ${len(extracted.abstract).toLocaleString()} chars`);
  console.log(`  Prompt:          ${len(extracted.prompt).toLocaleString()} chars`);
  console.log(`  Thinking:        ${len(extracted.thinking).toLocaleString()} chars`);
  console.log(`  References:      ${len(extracted.references).toLocaleString()} chars`);
  console.log(`  Sources:         ${extracted.sources.length} [${sourcesSummary(extracted.sources)}]`);
  console.log(`  Conv. Turns:     ${extracted.conversationTurns?.length ?? 0}`);
  console.log(`  Confidence:      ${extracted.confidence}`);
  console.log(`  Warnings:        ${extracted.warnings.length}`);
  if (extracted.warnings.length > 0) {
    for (const w of extracted.warnings) console.log(`                   - ${w}`);
  }
  console.log(`  Selector Used:   ${extracted.diagnostics.selectorsTestedForWait.find(s => s.found)?.selector ?? 'body (fallback)'}`);

  if (extracted.conversationTurns && extracted.conversationTurns.length > 0) {
    console.log(`\n  Conversation Turns:`);
    for (const turn of extracted.conversationTurns) {
      console.log(`    Turn ${turn.index}: prompt=${turn.userMessage.length} chars, response=${turn.assistantMessage.length} chars`);
      console.log(`      Prompt:   ${preview(turn.userMessage, 100)}`);
      console.log(`      Response: ${preview(turn.assistantMessage, 100)}`);
    }
  }

  console.log(`\n  Response Preview:`);
  console.log(`  ${hr('─', 86)}`);
  const respLines = extracted.response.substring(0, 500).split('\n');
  for (const line of respLines) console.log(`  ${line}`);
  console.log(`  ${hr('─', 86)}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 2: Content Parsing
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${hr('━')}`);
  console.log('  STAGE 2: CONTENT PARSING (parseContent)');
  console.log(hr('━'));

  const parseStart = Date.now();
  const parsed: ParsedContent = parseContent(extracted.response, extracted.title, {
    preserveMarkdown: true,
    extractSources: true,
    minContentLength: 50,
  });
  const parseTime = Date.now() - parseStart;

  console.log(`\n  Time:            ${parseTime}ms`);
  console.log(`  Title:           ${preview(parsed.title, 80)}`);
  console.log(`  Response:        ${len(parsed.response).toLocaleString()} chars`);
  console.log(`  Abstract:        ${len(parsed.abstract).toLocaleString()} chars`);
  console.log(`  Prompt:          ${len(parsed.prompt).toLocaleString()} chars`);
  console.log(`  Thinking:        ${len(parsed.thinking).toLocaleString()} chars`);
  console.log(`  References:      ${len(parsed.references).toLocaleString()} chars`);
  console.log(`  Sources:         ${parsed.sources.length} [${sourcesSummary(parsed.sources)}]`);
  console.log(`  Sections Found:  ${parsed.parsedSections.join(', ') || '(none)'}`);
  console.log(`  Warnings:        ${parsed.warnings.length}`);
  if (parsed.warnings.length > 0) {
    for (const w of parsed.warnings) console.log(`                   - ${w}`);
  }

  // Show what changed between extraction and parsing
  console.log(`\n  Extraction → Parsing Delta:`);
  const respDelta = len(parsed.response) - len(extracted.response);
  console.log(`    Response:    ${len(extracted.response).toLocaleString()} → ${len(parsed.response).toLocaleString()} (${respDelta >= 0 ? '+' : ''}${respDelta.toLocaleString()})`);
  console.log(`    Abstract:    ${len(extracted.abstract).toLocaleString()} → ${len(parsed.abstract).toLocaleString()}`);
  console.log(`    Prompt:      ${len(extracted.prompt).toLocaleString()} → ${len(parsed.prompt).toLocaleString()}`);
  console.log(`    Thinking:    ${len(extracted.thinking).toLocaleString()} → ${len(parsed.thinking).toLocaleString()}`);
  console.log(`    References:  ${len(extracted.references).toLocaleString()} → ${len(parsed.references).toLocaleString()}`);
  console.log(`    Sources:     ${extracted.sources.length} → ${parsed.sources.length}`);

  if (parsed.prompt) {
    console.log(`\n  Parsed Prompt:`);
    console.log(`  ${hr('─', 86)}`);
    console.log(`  ${preview(parsed.prompt, 500)}`);
    console.log(`  ${hr('─', 86)}`);
  }

  if (parsed.abstract) {
    console.log(`\n  Parsed Abstract (first 400 chars):`);
    console.log(`  ${hr('─', 86)}`);
    console.log(`  ${preview(parsed.abstract, 400)}`);
    console.log(`  ${hr('─', 86)}`);
  }

  if (parsed.references) {
    console.log(`\n  Parsed References (first 400 chars):`);
    console.log(`  ${hr('─', 86)}`);
    console.log(`  ${preview(parsed.references, 400)}`);
    console.log(`  ${hr('─', 86)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 3: Normalization
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${hr('━')}`);
  console.log('  STAGE 3: NORMALIZATION (normalizeExtractedBriefData)');
  console.log(hr('━'));

  const normStart = Date.now();
  const normalized: BriefData = normalizeExtractedBriefData(extracted, { platform });
  const normTime = Date.now() - normStart;

  console.log(`\n  Time:            ${normTime}ms`);
  console.log(`  Title:           ${preview(normalized.title, 80)}`);
  console.log(`  Response:        ${len(normalized.response).toLocaleString()} chars`);
  console.log(`  Abstract:        ${len(normalized.abstract).toLocaleString()} chars`);
  console.log(`  Prompt:          ${len(normalized.prompt).toLocaleString()} chars`);
  console.log(`  Thinking:        ${len(normalized.thinking).toLocaleString()} chars`);
  console.log(`  References:      ${len(normalized.references).toLocaleString()} chars`);
  console.log(`  Sources:         ${normalized.sources.length} [${sourcesSummary(normalized.sources)}]`);
  console.log(`  Model:           ${normalized.model}`);
  console.log(`  Confidence:      ${normalized.confidence ?? 'N/A'}`);
  console.log(`  Conv. Turns:     ${normalized.conversationTurns?.length ?? 0}`);
  console.log(`  Selected Turn:   ${normalized.selectedTurnIndex ?? 'N/A'}`);
  console.log(`  Warnings:        ${(normalized.warnings ?? []).length}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 4: DB Field Mapping
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${hr('━')}`);
  console.log('  STAGE 4: DATABASE FIELD MAPPING');
  console.log(hr('━'));

  console.log(`
  BriefData Field        DB Brief Column     Status          Value
  ${hr('─', 86)}`);

  const fields: [string, string, string, string][] = [
    ['title',              'title (required)',  check(normalized.title),     preview(normalized.title, 50)],
    ['prompt',             'prompt (required)', check(normalized.prompt),    preview(normalized.prompt, 50)],
    ['response',           'response (req)',    check(normalized.response),  `${len(normalized.response).toLocaleString()} chars`],
    ['abstract',           'abstract (opt)',    check(normalized.abstract),  preview(normalized.abstract, 50)],
    ['thinking',           'thinking (opt)',    check(normalized.thinking),  preview(normalized.thinking, 50)],
    ['model',              'modelId (req)',     normalized.model ? 'OK' : 'MISSING', normalized.model],
    ['sources',            'Source[] (rel)',    normalized.sources.length > 0 ? `OK (${normalized.sources.length})` : 'EMPTY', sourcesSummary(normalized.sources)],
    ['references',         '(not stored)',      len(normalized.references) > 0 ? 'UNUSED' : 'N/A', `${len(normalized.references).toLocaleString()} chars extracted but no DB column`],
    ['confidence',         '(not stored)',      normalized.confidence ?? 'N/A', 'metadata only'],
    ['warnings',           '(not stored)',      `${(normalized.warnings ?? []).length}`, 'metadata only'],
    ['conversationTurns',  '(not stored)',      `${normalized.conversationTurns?.length ?? 0} turns`, 'used for turn selection only'],
    ['rawHtml',            '(not stored)',      len(normalized.rawHtml) > 0 ? `${len(normalized.rawHtml).toLocaleString()} chars` : 'N/A', 'discarded'],
  ];

  for (const [field, dbCol, status, value] of fields) {
    console.log(`  ${field.padEnd(22)} ${dbCol.padEnd(19)} ${status.padEnd(15)} ${value}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ISSUES & GAPS
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${hr('━')}`);
  console.log('  ISSUES & GAPS');
  console.log(hr('━'));

  const issues: string[] = [];

  // Required field checks
  if (!normalized.title || normalized.title.length === 0) {
    issues.push('CRITICAL: title is empty — Brief.title is required');
  }
  if (!normalized.prompt || normalized.prompt.length === 0) {
    issues.push('WARNING: prompt is empty — Brief.prompt is required, will store empty string');
  }
  if (!normalized.response || normalized.response.length === 0) {
    issues.push('CRITICAL: response is empty — Brief.response is required');
  }
  if (!normalized.model) {
    issues.push('CRITICAL: model is empty — Brief.modelId is required');
  }

  // Content quality checks
  if (normalized.response && normalized.response.length < 200) {
    issues.push(`WARNING: response is very short (${normalized.response.length} chars) — may be incomplete extraction`);
  }

  // Data loss checks
  if (len(normalized.references) > 0) {
    issues.push(`INFO: references text (${len(normalized.references).toLocaleString()} chars) is extracted but has no DB column — only parsed source URLs are stored via Source relation`);
  }
  if (len(normalized.rawHtml) > 0) {
    issues.push(`INFO: rawHtml (${len(normalized.rawHtml).toLocaleString()} chars) is extracted but not stored in DB`);
  }

  // Source comparison
  const extractedSourceUrls = new Set(extracted.sources.map(s => s.url));
  const normalizedSourceUrls = new Set(normalized.sources.map(s => s.url));
  const lostSources = extracted.sources.filter(s => !normalizedSourceUrls.has(s.url));
  const newSources = normalized.sources.filter(s => !extractedSourceUrls.has(s.url));
  if (lostSources.length > 0) {
    issues.push(`WARNING: ${lostSources.length} sources from extraction were lost during normalization`);
  }
  if (newSources.length > 0) {
    issues.push(`INFO: ${newSources.length} new sources found by parser (not in extraction)`);
  }

  // Content lost during parsing
  const totalParsedLen = len(parsed.response) + len(parsed.abstract) + len(parsed.prompt) + len(parsed.thinking) + len(parsed.references);
  const contentDelta = len(extracted.response) - totalParsedLen;
  if (contentDelta > 500) {
    issues.push(`WARNING: ${contentDelta.toLocaleString()} chars lost during parsing (extracted: ${len(extracted.response).toLocaleString()}, parsed total: ${totalParsedLen.toLocaleString()})`);
  }

  // Conversation turn handling
  if (normalized.conversationTurns && normalized.conversationTurns.length > 1) {
    issues.push(`INFO: ${normalized.conversationTurns.length} conversation turns detected — only selected turn (index ${normalized.selectedTurnIndex ?? 'auto'}) is used for prompt/response`);
  }

  if (issues.length === 0) {
    console.log('\n  No issues found — all fields map cleanly to DB schema.');
  } else {
    for (const issue of issues) {
      console.log(`\n  ${issue}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SAVE LOG
  // ═══════════════════════════════════════════════════════════════════════
  const logDir = path.join(process.cwd(), 'extraction_logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const timestamp = Date.now();
  const log = {
    timestamp: new Date().toISOString(),
    url,
    platform,
    model,
    stages: {
      extraction: {
        timeMs: extractTime,
        title: extracted.title,
        responseLength: len(extracted.response),
        abstractLength: len(extracted.abstract),
        promptLength: len(extracted.prompt),
        thinkingLength: len(extracted.thinking),
        referencesLength: len(extracted.references),
        sourcesCount: extracted.sources.length,
        turnsCount: extracted.conversationTurns?.length ?? 0,
        confidence: extracted.confidence,
        warnings: extracted.warnings,
        selectorUsed: extracted.diagnostics.selectorsTestedForWait.find(s => s.found)?.selector ?? 'body (fallback)',
      },
      parsing: {
        timeMs: parseTime,
        title: parsed.title,
        responseLength: len(parsed.response),
        abstractLength: len(parsed.abstract),
        promptLength: len(parsed.prompt),
        thinkingLength: len(parsed.thinking),
        referencesLength: len(parsed.references),
        sourcesCount: parsed.sources.length,
        parsedSections: parsed.parsedSections,
        warnings: parsed.warnings,
      },
      normalization: {
        timeMs: normTime,
        title: normalized.title,
        responseLength: len(normalized.response),
        abstractLength: len(normalized.abstract),
        promptLength: len(normalized.prompt),
        thinkingLength: len(normalized.thinking),
        referencesLength: len(normalized.references),
        sourcesCount: normalized.sources.length,
        model: normalized.model,
        confidence: normalized.confidence,
        selectedTurnIndex: normalized.selectedTurnIndex,
        warnings: normalized.warnings,
      },
      dbMapping: {
        title: { status: check(normalized.title), length: len(normalized.title) },
        prompt: { status: check(normalized.prompt), length: len(normalized.prompt) },
        response: { status: check(normalized.response), length: len(normalized.response) },
        abstract: { status: check(normalized.abstract), length: len(normalized.abstract) },
        thinking: { status: check(normalized.thinking), length: len(normalized.thinking) },
        model: normalized.model,
        sourcesCount: normalized.sources.length,
        referencesText: { stored: false, length: len(normalized.references) },
      },
    },
    issues,
    fullData: {
      extracted: {
        title: extracted.title,
        response: extracted.response,
        abstract: extracted.abstract,
        prompt: extracted.prompt,
        thinking: extracted.thinking,
        references: extracted.references,
        sources: extracted.sources,
        conversationTurns: extracted.conversationTurns,
      },
      parsed: {
        title: parsed.title,
        response: parsed.response,
        abstract: parsed.abstract,
        prompt: parsed.prompt,
        thinking: parsed.thinking,
        references: parsed.references,
        sources: parsed.sources,
        parsedSections: parsed.parsedSections,
      },
      normalized: {
        title: normalized.title,
        response: normalized.response,
        abstract: normalized.abstract,
        prompt: normalized.prompt,
        thinking: normalized.thinking,
        references: normalized.references,
        sources: normalized.sources,
        model: normalized.model,
        conversationTurns: normalized.conversationTurns,
        selectedTurnIndex: normalized.selectedTurnIndex,
      },
    },
  };

  const logFile = path.join(logDir, `diagnostic_${timestamp}.json`);
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));

  console.log(`\n${hr('═')}`);
  console.log(`  Log: ${logFile}`);
  console.log(`${hr('═')}\n`);
}

main().catch(err => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
