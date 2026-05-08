/**
 * Multi-Approach Extraction Test Script
 *
 * Tests brief extraction using three approaches and compares results side-by-side.
 *
 * Usage:
 *   npx tsx scripts/test-extraction.ts <url>
 *   npx tsx scripts/test-extraction.ts <url> --debug
 */

import { extractBriefFromUrlServer } from '../src/lib/extraction/server';
import { extractWithLogging } from '../src/functions/extractors/unified_extractor';
import { getConfigForPlatform } from '../src/functions/extractors/configs';
import { detectPlatform, mapPlatformToModel } from '../src/lib/extraction/platform';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ───────────────────────────────────────────────────────────────────

interface ApproachResult {
  name: string;
  success: boolean;
  timeMs: number;
  error?: string;
  title?: string;
  responseLength: number;
  abstractLength: number;
  promptLength: number;
  sourcesCount: number;
  turnsCount: number;
  confidence?: string;
  warnings: string[];
  authRequired: boolean;
  authNotes: string[];
  responsePreview: string;
}

// ── Auth detection ──────────────────────────────────────────────────────────

const AUTH_REDIRECT_PATTERNS = [
  /\/login/i,
  /\/signin/i,
  /\/sign-in/i,
  /accounts\.google\.com/i,
  /auth0\.com/i,
];

const AUTH_BODY_PATTERNS = [
  /sign\s*in/i,
  /log\s*in/i,
  /\bprivate\b/i,
  /access\s*denied/i,
  /unauthorized/i,
  /\b403\b.*forbidden/i,
  /please\s+(?:sign|log)\s+in/i,
];

function detectAuthFromHeaders(
  status: number,
  redirectUrl: string | null,
  headers: Record<string, string>
): { required: boolean; notes: string[] } {
  const notes: string[] = [];
  let required = false;

  if (status === 401 || status === 403) {
    required = true;
    notes.push(`HTTP ${status} response`);
  }

  if (redirectUrl) {
    for (const pattern of AUTH_REDIRECT_PATTERNS) {
      if (pattern.test(redirectUrl)) {
        required = true;
        notes.push(`Redirected to auth page: ${redirectUrl}`);
        break;
      }
    }
  }

  const wwwAuth = headers['www-authenticate'];
  if (wwwAuth) {
    required = true;
    notes.push(`WWW-Authenticate header present: ${wwwAuth}`);
  }

  return { required, notes };
}

function detectAuthFromBody(body: string): { required: boolean; notes: string[] } {
  const notes: string[] = [];
  let required = false;

  // Only check first 5000 chars to avoid false positives in actual content
  const sample = body.substring(0, 5000);
  for (const pattern of AUTH_BODY_PATTERNS) {
    if (pattern.test(sample)) {
      notes.push(`Page body contains auth indicator: "${pattern.source}"`);
      required = true;
    }
  }

  return { required, notes };
}

// ── Quality scoring ─────────────────────────────────────────────────────────

function computeQualityScore(result: ApproachResult): number {
  let score = 0;
  const maxScore = 100;

  // Content length (up to 40 points)
  if (result.responseLength > 5000) score += 40;
  else if (result.responseLength > 2000) score += 30;
  else if (result.responseLength > 500) score += 20;
  else if (result.responseLength > 100) score += 10;

  // Has title (15 points)
  if (result.title && result.title.length > 0) score += 15;

  // Has sources (15 points)
  if (result.sourcesCount > 0) score += 15;

  // Has abstract (10 points)
  if (result.abstractLength > 0) score += 10;

  // Has prompt (5 points)
  if (result.promptLength > 0) score += 5;

  // No warnings (10 points, minus 2 per warning)
  score += Math.max(0, 10 - result.warnings.length * 2);

  // Confidence bonus (5 points)
  if (result.confidence === 'high') score += 5;
  else if (result.confidence === 'medium') score += 3;

  return Math.min(score, maxScore);
}

// ── Approach 1: Direct HTTP Fetch ───────────────────────────────────────────

async function runDirectFetch(url: string): Promise<ApproachResult> {
  const start = Date.now();
  const warnings: string[] = [];
  const authNotes: string[] = [];
  let authRequired = false;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const timeMs = Date.now() - start;
    const body = await response.text();

    // Collect response headers as a plain object
    const headerObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerObj[key] = value;
    });

    // Auth detection from HTTP level
    const redirectUrl = response.redirected ? response.url : null;
    const httpAuth = detectAuthFromHeaders(response.status, redirectUrl, headerObj);
    if (httpAuth.required) {
      authRequired = true;
      authNotes.push(...httpAuth.notes);
    }

    // Auth detection from body
    const bodyAuth = detectAuthFromBody(body);
    if (bodyAuth.required) {
      authRequired = true;
      authNotes.push(...bodyAuth.notes);
    }

    // Extract title from HTML
    const titleMatch = body.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? '';

    // Extract text content (strip HTML tags, collapse whitespace)
    const textContent = body
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (textContent.length < 100) {
      warnings.push('Very little text content extracted — page likely requires JavaScript rendering');
    }

    if (body.includes('__NEXT_DATA__') || body.includes('__nuxt')) {
      warnings.push('Page uses SSR framework — content may be in JSON data, not rendered HTML');
    }

    if (body.includes('noscript')) {
      warnings.push('Page has <noscript> tags — JavaScript required for full content');
    }

    if (!authRequired && authNotes.length === 0) {
      authNotes.push('No auth indicators detected');
    }

    return {
      name: 'Direct HTTP Fetch',
      success: true,
      timeMs,
      title: title.substring(0, 100),
      responseLength: textContent.length,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      confidence: undefined,
      warnings,
      authRequired,
      authNotes,
      responsePreview: textContent.substring(0, 300),
    };
  } catch (error) {
    return {
      name: 'Direct HTTP Fetch',
      success: false,
      timeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      responseLength: 0,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      warnings: [],
      authRequired: false,
      authNotes: [],
      responsePreview: '',
    };
  }
}

// ── Approach 2: Puppeteer Headless ──────────────────────────────────────────

async function runPuppeteerExtraction(
  url: string,
  platform: string,
  debug: boolean
): Promise<ApproachResult> {
  const start = Date.now();
  const authNotes: string[] = [];
  let authRequired = false;

  try {
    const config = getConfigForPlatform(platform);
    if (debug) {
      config.debugMode = true;
    }

    const result = await extractWithLogging(url, config);
    const timeMs = Date.now() - start;

    // Check warnings for auth indicators
    for (const w of result.warnings) {
      if (/auth|login|sign.?in|private/i.test(w)) {
        authRequired = true;
        authNotes.push(`Extractor warning: ${w}`);
      }
    }

    if (!authRequired) {
      authNotes.push('No auth indicators detected');
    }

    return {
      name: 'Puppeteer Headless',
      success: true,
      timeMs,
      title: (result.title || '').substring(0, 100),
      responseLength: result.response.length,
      abstractLength: result.abstract?.length ?? 0,
      promptLength: result.prompt?.length ?? 0,
      sourcesCount: result.sources.length,
      turnsCount: result.conversationTurns?.length ?? 0,
      confidence: result.confidence,
      warnings: result.warnings,
      authRequired,
      authNotes,
      responsePreview: result.response.substring(0, 300),
    };
  } catch (error) {
    return {
      name: 'Puppeteer Headless',
      success: false,
      timeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      responseLength: 0,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      warnings: [],
      authRequired: false,
      authNotes: [],
      responsePreview: '',
    };
  }
}

// ── Approach 3: Full Pipeline ───────────────────────────────────────────────

async function runFullPipeline(url: string): Promise<ApproachResult> {
  const start = Date.now();
  const authNotes: string[] = [];
  let authRequired = false;

  try {
    const result = await extractBriefFromUrlServer(url);
    const timeMs = Date.now() - start;

    // Check warnings for auth indicators
    for (const w of result.warnings ?? []) {
      if (/auth|login|sign.?in|private/i.test(w)) {
        authRequired = true;
        authNotes.push(`Pipeline warning: ${w}`);
      }
    }

    if (!authRequired) {
      authNotes.push('No auth indicators detected');
    }

    return {
      name: 'Full Pipeline',
      success: true,
      timeMs,
      title: (result.title || '').substring(0, 100),
      responseLength: result.response.length,
      abstractLength: result.abstract?.length ?? 0,
      promptLength: result.prompt?.length ?? 0,
      sourcesCount: result.sources.length,
      turnsCount: result.conversationTurns?.length ?? 0,
      confidence: result.confidence,
      warnings: result.warnings ?? [],
      authRequired,
      authNotes,
      responsePreview: result.response.substring(0, 300),
    };
  } catch (error) {
    return {
      name: 'Full Pipeline',
      success: false,
      timeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      responseLength: 0,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      warnings: [],
      authRequired: false,
      authNotes: [],
      responsePreview: '',
    };
  }
}

// ── Output formatting ───────────────────────────────────────────────────────

function printApproachResult(result: ApproachResult, index: number): void {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`  APPROACH ${index}: ${result.name.toUpperCase()}`);
  console.log(`${'━'.repeat(80)}`);

  if (!result.success) {
    console.log(`\n  Status:  FAILED`);
    console.log(`  Error:   ${result.error}`);
    console.log(`  Time:    ${(result.timeMs / 1000).toFixed(2)}s`);
    return;
  }

  console.log(`\n  Status:          OK`);
  console.log(`  Time:            ${(result.timeMs / 1000).toFixed(2)}s`);
  console.log(`  Auth Required:   ${result.authRequired ? 'YES' : 'No'}`);

  if (result.authNotes.length > 0) {
    for (const note of result.authNotes) {
      console.log(`                   - ${note}`);
    }
  }

  console.log(`  Title:           ${result.title || '(none)'}`);
  console.log(`  Response:        ${result.responseLength.toLocaleString()} chars`);
  console.log(`  Abstract:        ${result.abstractLength.toLocaleString()} chars`);
  console.log(`  Prompt:          ${result.promptLength.toLocaleString()} chars`);
  console.log(`  Sources:         ${result.sourcesCount}`);
  console.log(`  Conv. Turns:     ${result.turnsCount}`);
  console.log(`  Confidence:      ${result.confidence ?? 'N/A'}`);
  console.log(`  Quality Score:   ${computeQualityScore(result)}/100`);

  if (result.warnings.length > 0) {
    console.log(`  Warnings (${result.warnings.length}):`);
    for (const w of result.warnings) {
      console.log(`    - ${w}`);
    }
  }

  if (result.responsePreview) {
    console.log(`\n  Preview (first 300 chars):`);
    console.log(`  ${'─'.repeat(76)}`);
    const lines = result.responsePreview.split('\n');
    for (const line of lines) {
      console.log(`  ${line}`);
    }
    console.log(`  ${'─'.repeat(76)}`);
  }
}

function printComparisonTable(results: ApproachResult[]): void {
  console.log(`\n${'═'.repeat(80)}`);
  console.log('  COMPARISON TABLE');
  console.log(`${'═'.repeat(80)}\n`);

  const col1 = 20; // metric label
  const colW = 18; // each result column

  // Header
  const header =
    'Metric'.padEnd(col1) +
    results.map((r) => r.name.padEnd(colW)).join('');
  console.log(`  ${header}`);
  console.log(`  ${'─'.repeat(col1 + results.length * colW)}`);

  // Rows
  const check = (v: boolean) => (v ? 'YES' : '-');
  const val = (v: string | number | undefined) =>
    v === undefined || v === '' ? 'N/A' : String(v);

  const rows: [string, (r: ApproachResult) => string][] = [
    ['Status', (r) => (r.success ? 'OK' : 'FAILED')],
    ['Time', (r) => `${(r.timeMs / 1000).toFixed(2)}s`],
    ['Title', (r) => (r.title && r.title.length > 0 ? 'Yes' : '-')],
    ['Response (chars)', (r) => r.responseLength.toLocaleString()],
    ['Abstract (chars)', (r) => r.abstractLength.toLocaleString()],
    ['Prompt (chars)', (r) => r.promptLength.toLocaleString()],
    ['Sources', (r) => String(r.sourcesCount)],
    ['Conv. Turns', (r) => String(r.turnsCount)],
    ['Confidence', (r) => val(r.confidence)],
    ['Quality Score', (r) => `${computeQualityScore(r)}/100`],
    ['Auth Required', (r) => check(r.authRequired)],
    ['Warnings', (r) => String(r.warnings.length)],
  ];

  for (const [label, fn] of rows) {
    const row =
      label.padEnd(col1) +
      results.map((r) => fn(r).padEnd(colW)).join('');
    console.log(`  ${row}`);
  }

  console.log('');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const url = args.find((a) => !a.startsWith('--'));
  const debug = args.includes('--debug');

  if (!url) {
    console.error('Usage: npx tsx scripts/test-extraction.ts <url> [--debug]');
    console.error('');
    console.error('Options:');
    console.error('  --debug    Enable debug mode (saves screenshots and HTML snapshots)');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/test-extraction.ts https://www.perplexity.ai/search/...');
    console.error('  npx tsx scripts/test-extraction.ts https://chatgpt.com/share/... --debug');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  const platform = detectPlatform(url);
  const model = mapPlatformToModel(platform);

  console.log('');
  console.log(`${'═'.repeat(80)}`);
  console.log('  MULTI-APPROACH EXTRACTION TEST');
  console.log(`${'═'.repeat(80)}`);
  console.log(`  URL:       ${url}`);
  console.log(`  Platform:  ${platform}`);
  console.log(`  Model:     ${model}`);
  console.log(`  Debug:     ${debug ? 'ON' : 'OFF'}`);
  console.log(`  Time:      ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(80)}`);

  const results: ApproachResult[] = [];

  // ── Approach 1: Direct HTTP Fetch ─────────────────────────────────────

  console.log('\n  [1/3] Running Direct HTTP Fetch...');
  const fetchResult = await runDirectFetch(url);
  results.push(fetchResult);
  printApproachResult(fetchResult, 1);

  // ── Approach 2: Puppeteer Headless ────────────────────────────────────

  console.log('\n  [2/3] Running Puppeteer Headless extraction...');
  const puppeteerResult = await runPuppeteerExtraction(url, platform, debug);
  results.push(puppeteerResult);
  printApproachResult(puppeteerResult, 2);

  // ── Approach 3: Full Pipeline ─────────────────────────────────────────

  console.log('\n  [3/3] Running Full Pipeline (extract + normalize + parse)...');
  const pipelineResult = await runFullPipeline(url);
  results.push(pipelineResult);
  printApproachResult(pipelineResult, 3);

  // ── Comparison Table ──────────────────────────────────────────────────

  printComparisonTable(results);

  // ── Best approach recommendation ──────────────────────────────────────

  const scored = results
    .filter((r) => r.success)
    .map((r) => ({ name: r.name, score: computeQualityScore(r) }))
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0]) {
    console.log(`  Best approach: ${scored[0].name} (quality score: ${scored[0].score}/100)`);
  }
  console.log('');

  // ── Save JSON log ─────────────────────────────────────────────────────

  const logDir = path.join(process.cwd(), 'extraction_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = Date.now();
  const logData = {
    timestamp: new Date().toISOString(),
    url,
    platform,
    model,
    debug,
    approaches: results.map((r) => ({
      ...r,
      qualityScore: computeQualityScore(r),
    })),
    comparison: {
      bestApproach: scored[0]?.name ?? 'none',
      bestScore: scored[0]?.score ?? 0,
    },
  };

  const logFile = path.join(logDir, `multi_test_${timestamp}.json`);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
  console.log(`  Log saved: ${logFile}\n`);
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
