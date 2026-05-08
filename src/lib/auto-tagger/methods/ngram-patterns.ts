/**
 * Method 5: N-gram Patterns
 * Matches multi-word phrases (bigrams/trigrams) against curated phrase profiles.
 * Catches compound terms like "machine learning" or "clinical trial".
 */

import type { CategoryVote, TagInput } from '../types';
import { stripHtml, tokenize, bigrams, trigrams } from '../text-utils';
import { NGRAM_PROFILES } from '../dictionaries/ngram-profiles';

export function ngramPatterns(input: TagInput): CategoryVote[] {
  const fullText = [input.title, input.abstract, input.prompt, stripHtml(input.response)].join(' ');
  const tokens = tokenize(fullText);

  const bi = new Set(bigrams(tokens));
  const tri = new Set(trigrams(tokens));

  const votes: CategoryVote[] = [];

  for (const [category, phrases] of Object.entries(NGRAM_PROFILES)) {
    let matchCount = 0;

    for (const phrase of phrases) {
      const phraseTokens = tokenize(phrase);
      if (phraseTokens.length === 2) {
        if (bi.has(phraseTokens.join(' '))) {
          matchCount++;
        }
      } else if (phraseTokens.length === 3) {
        if (tri.has(phraseTokens.join(' '))) {
          matchCount++;
        }
      }
    }

    if (matchCount === 0) continue;

    // Phrase matches are high-value: 1 match = 0.3, 2 = 0.5, 3+ = 0.7+
    const score = Math.min(1.0, matchCount * 0.2 + 0.1);
    votes.push({ category, score });
  }

  return votes;
}
