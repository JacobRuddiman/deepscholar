/**
 * Method 1: Keyword Dictionary
 * Matches single-word terms from curated per-category lists against full text.
 * Broad coverage, simple matching.
 */

import type { CategoryVote, TagInput } from '../types';
import { stripHtml, tokenize, wordFrequency } from '../text-utils';
import { CATEGORY_KEYWORDS } from '../dictionaries/category-keywords';

export function keywordDictionary(input: TagInput): CategoryVote[] {
  const fullText = [input.title, input.abstract, input.prompt, stripHtml(input.response)].join(' ');
  const tokens = tokenize(fullText);
  const freq = wordFrequency(tokens);
  const totalTokens = tokens.length || 1;

  const votes: CategoryVote[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    let matchedWords = 0;

    for (const kw of keywords) {
      const count = freq.get(kw) ?? 0;
      if (count > 0) {
        matchCount += count;
        matchedWords++;
      }
    }

    if (matchedWords === 0) continue;

    // Score: combination of distinct keyword coverage and frequency density
    const coverage = matchedWords / keywords.length;     // What fraction of keywords appeared
    const density = matchCount / totalTokens;             // How often they appeared relative to text length

    // Blend: coverage matters more than raw density
    const score = Math.min(1.0, coverage * 2.5 + density * 5);

    if (score > 0) {
      votes.push({ category, score });
    }
  }

  return votes;
}
