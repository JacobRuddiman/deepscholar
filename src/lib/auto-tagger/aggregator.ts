/**
 * Democratic voting aggregator.
 *
 * Runs all 7 methods, applies quorum + threshold, returns top categories.
 *
 * Rules:
 * - A vote counts only if score >= 0.15
 * - Category assigned if 3+ methods voted AND aggregate score >= 1.5
 * - Max 3 categories, sorted by aggregate score
 * - If nothing passes quorum → no tags (better than wrong tags)
 * - Weights: source-domain 1.2, prompt-intent 1.1, all others 1.0
 */

import type { TagInput, MethodResult, AutoTagResult } from './types';
import { keywordDictionary } from './methods/keyword-dictionary';
import { tfidfProfiles } from './methods/tfidf-profiles';
import { sourceDomain } from './methods/source-domain';
import { headingStructure } from './methods/heading-structure';
import { ngramPatterns } from './methods/ngram-patterns';
import { entityHeuristics } from './methods/entity-heuristics';
import { promptIntent } from './methods/prompt-intent';

const VOTE_THRESHOLD = 0.15;  // Minimum score for a vote to count
const QUORUM = 3;             // Minimum number of methods that must agree
const AGGREGATE_THRESHOLD = 1.5; // Minimum aggregate score
const MAX_CATEGORIES = 3;

/** Method definitions with names and weights */
const METHODS: Array<{
  name: string;
  fn: (input: TagInput) => import('./types').CategoryVote[];
  weight: number;
}> = [
  { name: 'keyword-dictionary', fn: keywordDictionary, weight: 1.0 },
  { name: 'tfidf-profiles', fn: tfidfProfiles, weight: 1.0 },
  { name: 'source-domain', fn: sourceDomain, weight: 1.2 },
  { name: 'heading-structure', fn: headingStructure, weight: 1.0 },
  { name: 'ngram-patterns', fn: ngramPatterns, weight: 1.0 },
  { name: 'entity-heuristics', fn: entityHeuristics, weight: 1.0 },
  { name: 'prompt-intent', fn: promptIntent, weight: 1.1 },
];

export function runAggregator(input: TagInput): AutoTagResult {
  const start = performance.now();

  // Run all methods
  const methodResults: MethodResult[] = [];
  for (const { name, fn } of METHODS) {
    const votes = fn(input);
    methodResults.push({ method: name, votes });
  }

  // Aggregate: for each category, count qualifying votes and sum weighted scores
  const categoryAgg = new Map<string, { voterCount: number; weightedSum: number }>();

  for (let i = 0; i < METHODS.length; i++) {
    const method = METHODS[i]!;
    const result = methodResults[i]!;

    for (const vote of result.votes) {
      if (vote.score < VOTE_THRESHOLD) continue;

      const existing = categoryAgg.get(vote.category) ?? { voterCount: 0, weightedSum: 0 };
      existing.voterCount++;
      existing.weightedSum += vote.score * method.weight;
      categoryAgg.set(vote.category, existing);
    }
  }

  // Filter by quorum and aggregate threshold, then sort
  const candidates: Array<{ category: string; score: number }> = [];
  const scores: Record<string, number> = {};

  for (const [category, agg] of categoryAgg) {
    scores[category] = agg.weightedSum;
    if (agg.voterCount >= QUORUM && agg.weightedSum >= AGGREGATE_THRESHOLD) {
      candidates.push({ category, score: agg.weightedSum });
    }
  }

  // Sort by aggregate score descending, take top MAX_CATEGORIES
  candidates.sort((a, b) => b.score - a.score);
  const categories = candidates.slice(0, MAX_CATEGORIES).map(c => c.category);

  const elapsed = performance.now() - start;

  return {
    categories,
    scores,
    methodBreakdown: methodResults,
    elapsed,
  };
}
