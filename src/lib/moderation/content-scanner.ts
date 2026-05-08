/**
 * Content scanning module.
 *
 * Hybrid architecture:
 * 1. Local pattern matching (obscenity) — ~1ms, catches explicit slurs/hate
 * 2. OpenAI Moderation API (free) — ~50ms, 13 semantic categories with scores
 *
 * If OPENAI_API_KEY is not set, falls back to local-only scanning.
 */

import { runLocalFilter } from './local-filter';
import { CATEGORY_THRESHOLDS, classifyTier, exceedsThreshold, type ModerationTier } from './thresholds';

export interface ContentFlag {
  category: string;
  score: number;
  threshold: number;
}

export interface ScanResult {
  allowed: boolean;
  tier: ModerationTier;
  flags: ContentFlag[];
  scores: Record<string, number>;
  localFilterFlagged: boolean;
}

/**
 * Truncate text to a safe length for the moderation API.
 * OpenAI Moderation supports up to ~100k chars but we cap at 32k
 * to keep latency low.
 */
function truncateForApi(text: string): string {
  const MAX_LENGTH = 32_000;
  if (text.length <= MAX_LENGTH) return text;
  return text.slice(0, MAX_LENGTH);
}

/**
 * Call the OpenAI Moderation API.
 * Returns null if the API key is not configured or the call fails.
 */
async function callOpenAiModeration(
  text: string
): Promise<Record<string, number> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: truncateForApi(text),
      }),
    });

    if (!response.ok) {
      console.error('OpenAI Moderation API error:', response.status);
      return null;
    }

    const data = (await response.json()) as {
      results: Array<{
        category_scores: Record<string, number>;
      }>;
    };

    const result = data.results[0];
    if (!result) return null;

    return result.category_scores;
  } catch (error) {
    console.error('OpenAI Moderation API call failed:', String(error));
    return null;
  }
}

/**
 * Scan content for policy violations.
 *
 * Flow:
 * 1. Run local obscenity filter (fast, catches explicit slurs)
 * 2. If local passes, run OpenAI Moderation API for semantic analysis
 * 3. Apply research-platform thresholds
 * 4. Return tiered result
 */
export async function scanContent(text: string): Promise<ScanResult> {
  // Step 1: Local filter
  const localResult = runLocalFilter(text);

  if (localResult.flagged) {
    return {
      allowed: false,
      tier: 'block',
      flags: [
        {
          category: 'local/profanity',
          score: 1.0,
          threshold: 0,
        },
      ],
      scores: { 'local/profanity': 1.0 },
      localFilterFlagged: true,
    };
  }

  // Step 2: OpenAI Moderation API (if configured)
  const categoryScores = await callOpenAiModeration(text);

  if (!categoryScores) {
    // No API key or API failure — allow with local-only result
    return {
      allowed: true,
      tier: 'clean',
      flags: [],
      scores: {},
      localFilterFlagged: false,
    };
  }

  // Step 3: Apply thresholds
  const flags: ContentFlag[] = [];
  let maxScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) maxScore = score;

    if (exceedsThreshold(category, score)) {
      const threshold = CATEGORY_THRESHOLDS[category] ?? 0.5;
      flags.push({ category, score, threshold });
    }
  }

  // Step 4: Classify tier
  const tier = classifyTier(maxScore);
  const allowed = tier !== 'block';

  return {
    allowed,
    tier,
    flags,
    scores: categoryScores,
    localFilterFlagged: false,
  };
}
