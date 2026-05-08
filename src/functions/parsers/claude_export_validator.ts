/**
 * Claude Deep Research Export Validator
 *
 * Validates that an uploaded markdown file is a genuine Claude "Compass"
 * deep research export based on filename pattern and content structure.
 *
 * Filename pattern: compass_artifact_wf-{uuid}_text_markdown.md
 *
 * Content structural signals:
 *  - Starts with # heading (no YAML front matter)
 *  - Bold summary paragraph after heading
 *  - Horizontal rule (---) separator
 *  - Numbered ## N. sections (academic report structure)
 *  - arXiv citation patterns
 *  - Academic inline citations (Author et al., Venue Year)
 *  - Substantial length (deep research reports are typically 10K+ chars)
 */

export interface ClaudeExportValidation {
  /** Whether this passes as a Claude deep research export */
  isValid: boolean;
  /** Confidence in the validation (0-1) */
  confidence: number;
  /** What matched / failed */
  signals: ValidationSignal[];
  /** Human-readable summary */
  summary: string;
}

interface ValidationSignal {
  name: string;
  passed: boolean;
  weight: number;
  detail?: string;
}

// ── Filename validation ───────────────────────────────────────────────────

const COMPASS_FILENAME_REGEX =
  /^compass_artifact_wf-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_text_markdown\.md$/i;

export function isClaudeExportFilename(filename: string): boolean {
  return COMPASS_FILENAME_REGEX.test(filename);
}

// ── Content validation ────────────────────────────────────────────────────

/** Minimum character count for a deep research report */
const MIN_CONTENT_LENGTH = 5000;

/** Minimum number of ## sections expected */
const MIN_NUMBERED_SECTIONS = 3;

export function validateClaudeExport(
  content: string,
  filename?: string
): ClaudeExportValidation {
  const signals: ValidationSignal[] = [];

  // Signal 1: Filename matches compass pattern (strongest signal)
  if (filename) {
    const filenameMatch = COMPASS_FILENAME_REGEX.test(filename);
    signals.push({
      name: 'filename_pattern',
      passed: filenameMatch,
      weight: 0.35,
      detail: filenameMatch
        ? 'Filename matches compass_artifact_wf-{uuid}_text_markdown.md'
        : `Filename "${filename}" does not match Claude export pattern`,
    });
  }

  // Signal 2: Starts with # heading (no front matter)
  const startsWithHeading = /^# .{5,200}\s*$/m.test(content.substring(0, 500));
  const hasFrontMatter = content.trimStart().startsWith('---');
  signals.push({
    name: 'heading_start',
    passed: startsWithHeading && !hasFrontMatter,
    weight: 0.10,
    detail: startsWithHeading
      ? 'Content starts with # heading'
      : 'Missing # heading at start of content',
  });

  // Signal 3: Has horizontal rule after introductory paragraph
  const introSection = content.substring(0, 3000);
  const hasHorizontalRule = /\n---\s*\n/.test(introSection);
  signals.push({
    name: 'horizontal_rule',
    passed: hasHorizontalRule,
    weight: 0.05,
    detail: hasHorizontalRule
      ? 'Horizontal rule separator found after introduction'
      : 'No horizontal rule separator in introduction',
  });

  // Signal 4: Numbered ## N. sections
  const numberedSections = content.match(/^## \d+\.\s+.+$/gm) || [];
  const hasNumberedSections = numberedSections.length >= MIN_NUMBERED_SECTIONS;
  signals.push({
    name: 'numbered_sections',
    passed: hasNumberedSections,
    weight: 0.15,
    detail: `Found ${numberedSections.length} numbered sections (need ${MIN_NUMBERED_SECTIONS}+)`,
  });

  // Signal 5: arXiv citation patterns (arXiv:DDDD.DDDDD)
  const arxivCitations = content.match(/arXiv:\d{4}\.\d{4,5}/g) || [];
  const hasArxivCitations = arxivCitations.length >= 3;
  signals.push({
    name: 'arxiv_citations',
    passed: hasArxivCitations,
    weight: 0.10,
    detail: `Found ${arxivCitations.length} arXiv citations`,
  });

  // Signal 6: Academic inline citations (Author et al., Venue Year)
  const inlineCitations =
    content.match(/\([A-Z][a-z]+(?:\s+(?:et\s+al|&\s+[A-Z]))\.,?\s+(?:[A-Z][a-z]+\s+)?\d{4}\)/g) || [];
  const hasInlineCitations = inlineCitations.length >= 3;
  signals.push({
    name: 'inline_citations',
    passed: hasInlineCitations,
    weight: 0.05,
    detail: `Found ${inlineCitations.length} inline academic citations`,
  });

  // Signal 7: Bold emphasis patterns (Claude research uses **bold** extensively)
  const boldPatterns = content.match(/\*\*[^*]{5,200}\*\*/g) || [];
  const hasBoldEmphasis = boldPatterns.length >= 5;
  signals.push({
    name: 'bold_emphasis',
    passed: hasBoldEmphasis,
    weight: 0.05,
    detail: `Found ${boldPatterns.length} bold-emphasis passages`,
  });

  // Signal 8: Substantial length
  const isSubstantialLength = content.length >= MIN_CONTENT_LENGTH;
  signals.push({
    name: 'content_length',
    passed: isSubstantialLength,
    weight: 0.10,
    detail: `Content is ${content.length.toLocaleString()} chars (need ${MIN_CONTENT_LENGTH.toLocaleString()}+)`,
  });

  // Signal 9: Contains markdown tables
  const markdownTables = content.match(/^\|.+\|$/gm) || [];
  const hasTables = markdownTables.length >= 4; // header + separator + at least 2 rows
  signals.push({
    name: 'markdown_tables',
    passed: hasTables,
    weight: 0.05,
    detail: `Found ${markdownTables.length} table rows`,
  });

  // ── Score calculation ──────────────────────────────────────────────────

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const signal of signals) {
    totalWeight += signal.weight;
    if (signal.passed) {
      earnedWeight += signal.weight;
    }
  }

  const confidence = totalWeight > 0 ? earnedWeight / totalWeight : 0;

  // Filename alone is strong enough to validate
  const filenameSignal = signals.find(s => s.name === 'filename_pattern');
  const filenameValid = filenameSignal?.passed ?? false;

  // Content signals need a threshold
  const contentConfidence = signals
    .filter(s => s.name !== 'filename_pattern')
    .reduce((sum, s) => sum + (s.passed ? s.weight : 0), 0);
  const contentMaxWeight = signals
    .filter(s => s.name !== 'filename_pattern')
    .reduce((sum, s) => sum + s.weight, 0);
  const contentScore = contentMaxWeight > 0 ? contentConfidence / contentMaxWeight : 0;

  // Valid if: filename matches OR content score >= 0.6
  const isValid = filenameValid || contentScore >= 0.6;

  // Build summary
  const passedCount = signals.filter(s => s.passed).length;
  const failedSignals = signals.filter(s => !s.passed);
  let summary: string;

  if (filenameValid && contentScore >= 0.5) {
    summary = 'Verified Claude deep research export (filename + content structure match)';
  } else if (filenameValid) {
    summary = 'Verified Claude deep research export (filename matches)';
  } else if (contentScore >= 0.6) {
    summary = `Content structure matches Claude research format (${passedCount}/${signals.length} signals)`;
  } else {
    const missing = failedSignals.map(s => s.name).join(', ');
    summary = `Does not match Claude research export format. Missing: ${missing}`;
  }

  return { isValid, confidence, signals, summary };
}
