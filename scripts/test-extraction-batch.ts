/**
 * Batch Extraction Test Runner
 *
 * Reads URLs from scripts/test-urls.txt and runs the full extraction pipeline
 * on each one, producing a summary report at the end.
 *
 * Usage:
 *   npx tsx scripts/test-extraction-batch.ts
 *   npx tsx scripts/test-extraction-batch.ts --debug
 *   npx tsx scripts/test-extraction-batch.ts --file path/to/urls.txt
 */

import { extractBriefFromUrlServer } from '../src/lib/extraction/server';
import { extractWithLogging } from '../src/functions/extractors/unified_extractor';
import { getConfigForPlatform } from '../src/functions/extractors/configs';
import { detectPlatform, mapPlatformToModel } from '../src/lib/extraction/platform';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ───────────────────────────────────────────────────────────────────

interface UrlResult {
  url: string;
  platform: string;
  model: string;
  puppeteer: StepResult;
  pipeline: StepResult;
}

interface StepResult {
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
  warningCount: number;
  warnings: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readUrls(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

// ── Runners ─────────────────────────────────────────────────────────────────

async function runPuppeteer(
  url: string,
  platform: string,
  debug: boolean
): Promise<StepResult> {
  const start = Date.now();
  try {
    const config = getConfigForPlatform(platform);
    if (debug) config.debugMode = true;
    const result = await extractWithLogging(url, config);
    return {
      success: true,
      timeMs: Date.now() - start,
      title: result.title,
      responseLength: result.response.length,
      abstractLength: result.abstract?.length ?? 0,
      promptLength: result.prompt?.length ?? 0,
      sourcesCount: result.sources.length,
      turnsCount: result.conversationTurns?.length ?? 0,
      confidence: result.confidence,
      warningCount: result.warnings.length,
      warnings: result.warnings,
    };
  } catch (error) {
    return {
      success: false,
      timeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      responseLength: 0,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      warningCount: 0,
      warnings: [],
    };
  }
}

async function runPipeline(url: string): Promise<StepResult> {
  const start = Date.now();
  try {
    const result = await extractBriefFromUrlServer(url);
    return {
      success: true,
      timeMs: Date.now() - start,
      title: result.title,
      responseLength: result.response.length,
      abstractLength: result.abstract?.length ?? 0,
      promptLength: result.prompt?.length ?? 0,
      sourcesCount: result.sources.length,
      turnsCount: result.conversationTurns?.length ?? 0,
      confidence: result.confidence,
      warningCount: (result.warnings ?? []).length,
      warnings: result.warnings ?? [],
    };
  } catch (error) {
    return {
      success: false,
      timeMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
      responseLength: 0,
      abstractLength: 0,
      promptLength: 0,
      sourcesCount: 0,
      turnsCount: 0,
      warningCount: 0,
      warnings: [],
    };
  }
}

// ── Output ──────────────────────────────────────────────────────────────────

function statusIcon(s: StepResult): string {
  if (!s.success) return 'FAIL';
  if (s.responseLength === 0) return 'EMPTY';
  if (s.warningCount > 0) return 'WARN';
  return 'OK';
}

function printUrlResult(r: UrlResult, index: number, total: number): void {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`  [${index + 1}/${total}] ${r.url}`);
  console.log(`  Platform: ${r.platform}  |  Model: ${r.model}`);
  console.log(`${'━'.repeat(80)}`);

  for (const [label, step] of [
    ['Puppeteer', r.puppeteer],
    ['Full Pipeline', r.pipeline],
  ] as const) {
    const icon = statusIcon(step);
    if (!step.success) {
      console.log(`\n  ${label}: ${icon}`);
      console.log(`    Error: ${step.error}`);
      console.log(`    Time:  ${(step.timeMs / 1000).toFixed(2)}s`);
    } else {
      console.log(`\n  ${label}: ${icon}  (${(step.timeMs / 1000).toFixed(2)}s)`);
      console.log(
        `    Title:    ${step.title ? step.title.substring(0, 70) : '(none)'}`
      );
      console.log(
        `    Response: ${step.responseLength.toLocaleString()} chars  |  Abstract: ${step.abstractLength.toLocaleString()}  |  Prompt: ${step.promptLength.toLocaleString()}`
      );
      console.log(
        `    Sources:  ${step.sourcesCount}  |  Turns: ${step.turnsCount}  |  Confidence: ${step.confidence ?? 'N/A'}`
      );
      if (step.warningCount > 0) {
        console.log(`    Warnings: ${step.warnings.join('; ')}`);
      }
    }
  }
}

function printSummaryTable(results: UrlResult[]): void {
  console.log(`\n${'═'.repeat(100)}`);
  console.log('  SUMMARY');
  console.log(`${'═'.repeat(100)}\n`);

  // Column widths
  const cUrl = 40;
  const cPlat = 12;
  const cPuppStat = 8;
  const cPuppResp = 12;
  const cPipeStat = 8;
  const cPipeResp = 12;
  const cTime = 10;

  const hdr =
    'URL'.padEnd(cUrl) +
    'Platform'.padEnd(cPlat) +
    'Pup.'.padEnd(cPuppStat) +
    'Pup.Chars'.padEnd(cPuppResp) +
    'Pipe.'.padEnd(cPipeStat) +
    'Pipe.Chars'.padEnd(cPipeResp) +
    'Time'.padEnd(cTime);

  console.log(`  ${hdr}`);
  console.log(`  ${'─'.repeat(hdr.length)}`);

  for (const r of results) {
    const shortUrl =
      r.url.length > cUrl - 2
        ? r.url.substring(0, cUrl - 5) + '...'
        : r.url;
    const totalTime = (
      (r.puppeteer.timeMs + r.pipeline.timeMs) /
      1000
    ).toFixed(1);

    const row =
      shortUrl.padEnd(cUrl) +
      r.platform.padEnd(cPlat) +
      statusIcon(r.puppeteer).padEnd(cPuppStat) +
      r.puppeteer.responseLength.toLocaleString().padEnd(cPuppResp) +
      statusIcon(r.pipeline).padEnd(cPipeStat) +
      r.pipeline.responseLength.toLocaleString().padEnd(cPipeResp) +
      `${totalTime}s`.padEnd(cTime);

    console.log(`  ${row}`);
  }

  // Totals
  const totalUrls = results.length;
  const puppeteerOk = results.filter((r) => r.puppeteer.success && r.puppeteer.responseLength > 0).length;
  const pipelineOk = results.filter((r) => r.pipeline.success && r.pipeline.responseLength > 0).length;

  console.log(`\n  Total URLs:       ${totalUrls}`);
  console.log(`  Puppeteer OK:     ${puppeteerOk}/${totalUrls}`);
  console.log(`  Full Pipeline OK: ${pipelineOk}/${totalUrls}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const debug = args.includes('--debug');

  let urlFile = path.join(process.cwd(), 'scripts', 'test-urls.txt');
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    urlFile = path.resolve(args[fileIdx + 1]);
  }

  if (!fs.existsSync(urlFile)) {
    console.error(`URL file not found: ${urlFile}`);
    console.error('Create scripts/test-urls.txt with one URL per line.');
    process.exit(1);
  }

  const urls = readUrls(urlFile);

  if (urls.length === 0) {
    console.error('No URLs found in', urlFile);
    console.error('Add URLs to the file (one per line, # for comments).');
    process.exit(1);
  }

  // Validate
  const invalid = urls.filter((u) => !isValidUrl(u));
  if (invalid.length > 0) {
    console.error('Invalid URLs found:');
    for (const u of invalid) console.error(`  - ${u}`);
    process.exit(1);
  }

  console.log('');
  console.log(`${'═'.repeat(80)}`);
  console.log('  BATCH EXTRACTION TEST');
  console.log(`${'═'.repeat(80)}`);
  console.log(`  URL file:  ${urlFile}`);
  console.log(`  URLs:      ${urls.length}`);
  console.log(`  Debug:     ${debug ? 'ON' : 'OFF'}`);
  console.log(`  Time:      ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(80)}`);

  const results: UrlResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const platform = detectPlatform(url);
    const model = mapPlatformToModel(platform);

    console.log(`\n  [${i + 1}/${urls.length}] Testing: ${url}`);

    // Run Puppeteer first, then pipeline (pipeline launches its own browser)
    const puppeteerResult = await runPuppeteer(url, platform, debug);
    const pipelineResult = await runPipeline(url);

    const urlResult: UrlResult = {
      url,
      platform,
      model,
      puppeteer: puppeteerResult,
      pipeline: pipelineResult,
    };

    results.push(urlResult);
    printUrlResult(urlResult, i, urls.length);
  }

  // Summary table
  printSummaryTable(results);

  // Save JSON report
  const logDir = path.join(process.cwd(), 'extraction_logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    urlFile,
    debug,
    urlCount: urls.length,
    results: results.map((r) => ({
      url: r.url,
      platform: r.platform,
      model: r.model,
      puppeteer: { ...r.puppeteer },
      pipeline: { ...r.pipeline },
    })),
    summary: {
      total: urls.length,
      puppeteerOk: results.filter((r) => r.puppeteer.success && r.puppeteer.responseLength > 0).length,
      pipelineOk: results.filter((r) => r.pipeline.success && r.pipeline.responseLength > 0).length,
    },
  };

  const logFile = path.join(logDir, `batch_test_${timestamp}.json`);
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
  console.log(`\n  Report saved: ${logFile}\n`);
}

main().catch((err) => {
  console.error('\nFatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
