'use server';

import { extractFromChatGPTDeepResearch } from '@/functions/extractors/chatgpt_deep_research';
import { getConfigForPlatform } from '@/functions/extractors/configs';
import { extractFromGoogleDocs } from '@/functions/extractors/google_docs';
import type { ExtractionResult } from '@/functions/extractors/extractor_types';
import { extractFromPerplexity } from '@/functions/extractors/perplexity';
import { extractWithLogging } from '@/functions/extractors/unified_extractor';
import type { BriefData } from '@/functions/types';
import { normalizeExtractedBriefData } from './normalize';
import { detectPlatform, isChatGPTShareUrl, isGeminiShareUrl } from './platform';

/** Patterns that indicate the page is a Cloudflare challenge, not real content */
const BLOCKED_TITLE_PATTERNS = [
  /^just a moment/i,
  /^attention required/i,
  /^access denied/i,
  /^cloudflare/i,
  /^verify you are human/i,
  /^one more step/i,
];

const BLOCKED_BODY_PATTERNS = [
  /performing security verification/i,
  /verify you are human/i,
  /enable javascript and cookies to continue/i,
  /this website uses a security service/i,
  /checking your browser/i,
  /ray id:/i,
];

/**
 * Check whether an extraction result looks like a blocked/challenge page
 * rather than real content.
 */
function isBlockedExtraction(result: ExtractionResult): boolean {
  // Title matches known challenge pages
  const titleBlocked = BLOCKED_TITLE_PATTERNS.some((p) => p.test(result.title));

  // Body content matches challenge text
  const bodyBlocked = BLOCKED_BODY_PATTERNS.some((p) => p.test(result.response));

  // Very short response that looks like boilerplate
  const suspiciouslyShort = result.response.length < 500 && titleBlocked;

  // Content selectors all failed (used body fallback) AND title is suspicious
  const usedFallback =
    result.diagnostics.selectorsTestedForWait.length > 0 &&
    result.diagnostics.selectorsTestedForWait.every((s) => !s.found);

  if (titleBlocked && (bodyBlocked || usedFallback)) return true;
  if (suspiciouslyShort) return true;

  return false;
}

export async function extractBriefFromUrlServer(url: string): Promise<BriefData> {
  const platform = detectPlatform(url);

  // Google Docs: dedicated extractor (no Cloudflare issues)
  if (platform === 'google-docs') {
    const result = await extractFromGoogleDocs(url);
    return normalizeExtractedBriefData(result, { platform });
  }

  // ChatGPT share links: try deep-research extractor first, fall through to generic
  // if the share is a regular conversation (no div.deep-research-result)
  if (platform === 'chatgpt' && isChatGPTShareUrl(url)) {
    const debugMode =
      process.env.EXTRACTOR_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
    try {
      const result = await extractFromChatGPTDeepResearch(url, debugMode);
      return normalizeExtractedBriefData(result, { platform, skipContentParsing: true });
    } catch (error) {
      console.warn(
        `[extraction] ChatGPT deep research extractor failed: ${error instanceof Error ? error.message : String(error)} — falling through to generic pipeline`
      );
      // Fall through to generic headless/non-headless cascade below
    }
  }

  // Perplexity: structured DOM extractor (preserves headings, strips citation badges)
  if (platform === 'perplexity') {
    const debugMode =
      process.env.EXTRACTOR_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
    try {
      const result = await extractFromPerplexity(url, debugMode);
      return normalizeExtractedBriefData(result, { platform });
    } catch (error) {
      console.warn(
        `[extraction] Perplexity structured extractor failed: ${error instanceof Error ? error.message : String(error)} — falling through to generic pipeline`
      );
      // Fall through to generic headless/non-headless cascade below
    }
  }

  if (isGeminiShareUrl(url)) {
    console.warn(
      'Gemini share links often redirect to consent/auth pages. Client-side direct access will be attempted before server extraction.'
    );
  }

  const baseConfig = getConfigForPlatform(platform);
  const debugMode =
    process.env.EXTRACTOR_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';

  // ── Strategy 1: Headless + stealth ────────────────────────────────────
  try {
    const headlessConfig = { ...baseConfig, headless: true, debugMode };
    const result = await extractWithLogging(url, headlessConfig);

    if (!isBlockedExtraction(result)) {
      return normalizeExtractedBriefData(result, { platform });
    }

    console.warn(
      `[extraction] Headless attempt blocked (Cloudflare/auth) for ${platform} — retrying non-headless`
    );
  } catch (error) {
    console.warn(
      `[extraction] Headless attempt failed for ${platform}: ${error instanceof Error ? error.message : String(error)} — retrying non-headless`
    );
  }

  // ── Strategy 2: Non-headless + stealth (bypasses most bot detection) ──
  try {
    const visibleConfig = { ...baseConfig, headless: false, debugMode };
    const result = await extractWithLogging(url, visibleConfig);

    if (!isBlockedExtraction(result)) {
      return normalizeExtractedBriefData(result, { platform });
    }

    console.warn(
      `[extraction] Non-headless attempt also blocked for ${platform} — returning best effort`
    );
    return normalizeExtractedBriefData(result, { platform });
  } catch (error) {
    // Both strategies failed — throw so the caller gets a clear error
    throw new Error(
      `Extraction failed for ${platform} after all strategies: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
