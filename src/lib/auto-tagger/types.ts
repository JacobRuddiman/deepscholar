/**
 * Types for the auto-tagger ensemble voting system.
 */

/** Input to the auto-tagger — assembled from brief data at creation time */
export interface TagInput {
  title: string;
  abstract: string;
  response: string;
  prompt: string;
  sourceUrls: string[];
  htmlContent?: string;
}

/** A single method's vote for a category */
export interface CategoryVote {
  category: string;
  score: number; // 0.0–1.0
}

/** Result from one tagging method */
export interface MethodResult {
  method: string;
  votes: CategoryVote[];
}

/** Final output from the auto-tagger */
export interface AutoTagResult {
  categories: string[];      // Winning category names (max 3)
  scores: Record<string, number>; // Aggregate scores for each considered category
  methodBreakdown: MethodResult[];
  elapsed: number;           // Milliseconds
}
