/**
 * Auto-tagger public API.
 *
 * Usage:
 *   const result = autoTagBrief({ title, abstract, response, prompt, sourceUrls });
 *   // result.categories: string[] — up to 3 category names
 */

export type { TagInput, AutoTagResult } from './types';
import type { TagInput, AutoTagResult } from './types';
import { runAggregator } from './aggregator';

/**
 * Auto-tag a brief using ensemble voting across 7 text analysis methods.
 * Returns up to 3 category names that achieved quorum (3+ methods agree).
 *
 * Pure computation — no network calls, no database access.
 * Typical runtime: <50ms for average brief length.
 */
export function autoTagBrief(input: TagInput): AutoTagResult {
  return runAggregator(input);
}
