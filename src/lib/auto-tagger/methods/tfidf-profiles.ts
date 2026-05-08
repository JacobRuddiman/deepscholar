/**
 * Method 2: TF-IDF Profiles
 * Weighted term scoring that down-weights words appearing in many categories.
 * More discriminative than raw keyword matching.
 */

import type { CategoryVote, TagInput } from '../types';
import { stripHtml, tokenize, wordFrequency } from '../text-utils';
import { CATEGORY_KEYWORDS } from '../dictionaries/category-keywords';

/** Precompute IDF-like weights: words unique to fewer categories get higher weight */
const idfWeights = new Map<string, number>();
const categoryCount = Object.keys(CATEGORY_KEYWORDS).length;

// Build document frequency: how many categories contain each word
const docFreq = new Map<string, number>();
for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
  const unique = new Set(keywords);
  for (const word of unique) {
    docFreq.set(word, (docFreq.get(word) ?? 0) + 1);
  }
}

// IDF = log(totalCategories / docFreq) — words in fewer categories get higher weight
for (const [word, df] of docFreq) {
  idfWeights.set(word, Math.log(categoryCount / df));
}

export function tfidfProfiles(input: TagInput): CategoryVote[] {
  const fullText = [input.title, input.abstract, input.prompt, stripHtml(input.response)].join(' ');
  const tokens = tokenize(fullText);
  const freq = wordFrequency(tokens);
  const totalTokens = tokens.length || 1;

  const votes: CategoryVote[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let weightedScore = 0;
    let maxPossible = 0;

    for (const kw of keywords) {
      const idf = idfWeights.get(kw) ?? 1;
      maxPossible += idf;

      const tf = (freq.get(kw) ?? 0) / totalTokens;
      if (tf > 0) {
        weightedScore += tf * idf * 100; // Scale up for readability
      }
    }

    if (weightedScore === 0) continue;

    // Normalize against max possible score for this category
    const score = Math.min(1.0, weightedScore / (maxPossible * 0.02));

    if (score > 0) {
      votes.push({ category, score });
    }
  }

  return votes;
}
