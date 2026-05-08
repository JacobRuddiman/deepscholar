/**
 * Method 6: Entity Heuristics
 * Detects organization names, acronyms, and numeric patterns.
 * Pattern-based, not vocabulary — complementary to keyword methods.
 */

import type { CategoryVote, TagInput } from '../types';
import { stripHtml, extractAcronyms } from '../text-utils';
import { ACRONYM_MAP, ORG_PATTERNS, NUMERIC_PATTERNS } from '../dictionaries/entity-indicators';

export function entityHeuristics(input: TagInput): CategoryVote[] {
  const fullText = [input.title, input.abstract, input.prompt, stripHtml(input.response)].join(' ');
  const lowerText = fullText.toLowerCase();

  const categoryHits = new Map<string, number>();

  // 1. Acronym matching
  const acronyms = extractAcronyms(fullText);
  for (const acr of acronyms) {
    const categories = ACRONYM_MAP[acr];
    if (categories) {
      for (const cat of categories) {
        categoryHits.set(cat, (categoryHits.get(cat) ?? 0) + 1);
      }
    }
  }

  // 2. Organization name matching
  for (const { pattern, categories } of ORG_PATTERNS) {
    if (lowerText.includes(pattern)) {
      for (const cat of categories) {
        categoryHits.set(cat, (categoryHits.get(cat) ?? 0) + 2); // Org names are high signal
      }
    }
  }

  // 3. Numeric/formula pattern matching
  for (const { regex, categories } of NUMERIC_PATTERNS) {
    // Reset regex state for global patterns
    regex.lastIndex = 0;
    const matches = fullText.match(regex);
    if (matches && matches.length > 0) {
      // Only count if pattern appears meaningfully (2+ times or in short text)
      const threshold = fullText.length < 500 ? 1 : 2;
      if (matches.length >= threshold) {
        for (const cat of categories) {
          categoryHits.set(cat, (categoryHits.get(cat) ?? 0) + 1);
        }
      }
    }
  }

  // Convert hits to votes
  const votes: CategoryVote[] = [];
  for (const [category, hits] of categoryHits) {
    // 1 hit = 0.2, 2 hits = 0.35, 3+ hits = 0.5+
    const score = Math.min(1.0, hits * 0.15 + 0.05);
    votes.push({ category, score });
  }

  return votes;
}
