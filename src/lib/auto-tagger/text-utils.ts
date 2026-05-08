/**
 * Text processing utilities for the auto-tagger.
 * Pure functions, no external dependencies.
 */

/** Remove HTML tags and decode common entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize text into lowercase words, stripping punctuation */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/** Generate bigrams from a token array */
export function bigrams(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    result.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return result;
}

/** Generate trigrams from a token array */
export function trigrams(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length - 2; i++) {
    result.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return result;
}

/** Count word frequencies from a token array */
export function wordFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return freq;
}

/** Extract domain from a URL, returning null on failure */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Extract heading text from HTML (h1–h6, strong) */
export function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<(?:h[1-6]|strong)[^>]*>([\s\S]*?)<\/(?:h[1-6]|strong)>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const text = stripHtml(match[1] ?? '').trim();
    if (text.length > 0) {
      headings.push(text);
    }
  }
  return headings;
}

/** Extract uppercase acronyms (2-6 chars) from text */
export function extractAcronyms(text: string): string[] {
  const matches = text.match(/\b[A-Z]{2,6}\b/g);
  return matches ?? [];
}
