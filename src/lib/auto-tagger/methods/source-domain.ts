/**
 * Method 3: Source Domain
 * Maps source URLs to categories using a known domain dictionary.
 * Orthogonal signal — uses URLs, not text content.
 */

import type { CategoryVote, TagInput } from '../types';
import { extractDomain } from '../text-utils';
import { DOMAIN_MAP } from '../dictionaries/domain-map';

export function sourceDomain(input: TagInput): CategoryVote[] {
  if (input.sourceUrls.length === 0) return [];

  const categoryHits = new Map<string, number>();
  let matchedDomains = 0;

  for (const url of input.sourceUrls) {
    const domain = extractDomain(url);
    if (!domain) continue;

    // Try exact match first, then check parent domains
    const categories = DOMAIN_MAP[domain]
      ?? DOMAIN_MAP[domain.split('.').slice(-2).join('.')];

    if (categories) {
      matchedDomains++;
      for (const cat of categories) {
        categoryHits.set(cat, (categoryHits.get(cat) ?? 0) + 1);
      }
    }
  }

  if (matchedDomains === 0) return [];

  const votes: CategoryVote[] = [];

  for (const [category, hits] of categoryHits) {
    // Score based on how many source domains pointed to this category
    // 1 hit = 0.4, 2 hits = 0.65, 3+ hits = 0.85+
    const score = Math.min(1.0, 0.15 + hits * 0.25);
    votes.push({ category, score });
  }

  return votes;
}
