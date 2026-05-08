/**
 * Method 4: Heading Structure
 * Extracts HTML headings (h2/h3/strong) and matches against category keywords.
 * Structural signal — headings carry 2x semantic weight.
 */

import type { CategoryVote, TagInput } from '../types';
import { extractHeadings, tokenize, wordFrequency } from '../text-utils';
import { CATEGORY_KEYWORDS } from '../dictionaries/category-keywords';

export function headingStructure(input: TagInput): CategoryVote[] {
  const html = input.htmlContent ?? input.response;
  const headings = extractHeadings(html);

  if (headings.length === 0) return [];

  const headingText = headings.join(' ');
  const tokens = tokenize(headingText);
  const freq = wordFrequency(tokens);

  const votes: CategoryVote[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchedKeywords = 0;

    for (const kw of keywords) {
      if (freq.has(kw)) {
        matchedKeywords++;
      }
    }

    if (matchedKeywords === 0) continue;

    // Headings are high-signal: even 2-3 keyword matches in headings is meaningful
    const score = Math.min(1.0, matchedKeywords * 0.2);
    votes.push({ category, score });
  }

  return votes;
}
