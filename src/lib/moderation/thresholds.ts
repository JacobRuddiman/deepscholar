/**
 * Moderation thresholds calibrated for a research/academic platform.
 *
 * OpenAI Moderation API returns 0-1 confidence scores for 13 categories.
 * We raise thresholds for categories that commonly produce false positives
 * in research contexts (medical, conflict, biological discussions).
 */

export const CATEGORY_THRESHOLDS: Record<string, number> = {
  'sexual': 0.7,                // Allow medical/biological discussion
  'sexual/minors': 0.1,         // Near-zero tolerance
  'harassment': 0.5,            // Default
  'harassment/threatening': 0.4, // Slightly stricter
  'hate': 0.5,                  // Default
  'hate/threatening': 0.4,      // Slightly stricter
  'self-harm': 0.5,             // Default
  'self-harm/intent': 0.4,      // Slightly stricter
  'self-harm/instructions': 0.3,// Strict
  'violence': 0.6,              // Allow conflict/war research
  'violence/graphic': 0.5,      // Default
};

/** Tier boundaries based on max score across all categories */
export type ModerationTier = 'clean' | 'caution' | 'review' | 'block';

export function classifyTier(maxScore: number): ModerationTier {
  if (maxScore < 0.3) return 'clean';
  if (maxScore < 0.6) return 'caution';
  if (maxScore < 0.8) return 'review';
  return 'block';
}

/** Whether a category score exceeds our threshold */
export function exceedsThreshold(category: string, score: number): boolean {
  const threshold = CATEGORY_THRESHOLDS[category] ?? 0.5;
  return score >= threshold;
}
