/**
 * Entity-based indicators: acronyms, known organizations,
 * and regex patterns that signal specific categories.
 */

/** Known acronyms mapped to categories */
export const ACRONYM_MAP: Record<string, string[]> = {
  // Technology
  'AI': ['Technology'],
  'ML': ['Technology'],
  'NLP': ['Technology'],
  'API': ['Technology'],
  'CSS': ['Technology'],
  'HTML': ['Technology'],
  'SQL': ['Technology'],
  'GPU': ['Technology'],
  'CPU': ['Technology'],
  'SaaS': ['Technology'],
  'IoT': ['Technology'],
  'VR': ['Technology'],
  'AR': ['Technology'],

  // Science
  'DNA': ['Science', 'Health & Medicine'],
  'RNA': ['Science', 'Health & Medicine'],
  'PCR': ['Science', 'Health & Medicine'],
  'CRISPR': ['Science'],
  'LHC': ['Science'],

  // Health & Medicine
  'WHO': ['Health & Medicine'],
  'CDC': ['Health & Medicine'],
  'FDA': ['Health & Medicine'],
  'NIH': ['Health & Medicine'],
  'ICU': ['Health & Medicine'],
  'MRI': ['Health & Medicine'],
  'CT': ['Health & Medicine'],
  'EKG': ['Health & Medicine'],
  'BMI': ['Health & Medicine'],
  'HIV': ['Health & Medicine'],
  'ADHD': ['Health & Medicine', 'Psychology'],
  'PTSD': ['Psychology', 'Health & Medicine'],
  'CBT': ['Psychology'],

  // Finance
  'GDP': ['Finance'],
  'IPO': ['Finance'],
  'ETF': ['Finance'],
  'SEC': ['Finance'],
  'NYSE': ['Finance'],
  'NASDAQ': ['Finance'],
  'FDIC': ['Finance'],
  'FOMC': ['Finance'],

  // Politics
  'NATO': ['Politics'],
  'UN': ['Politics'],
  'EU': ['Politics'],
  'GOP': ['Politics'],
  'DNC': ['Politics'],

  // Environment
  'EPA': ['Environment'],
  'IPCC': ['Environment'],
  'COP': ['Environment'],
  'ESG': ['Environment', 'Finance'],

  // Sports
  'NBA': ['Sports'],
  'NFL': ['Sports'],
  'MLB': ['Sports'],
  'FIFA': ['Sports'],
  'UEFA': ['Sports'],
  'NHL': ['Sports'],
  'UFC': ['Sports'],
  'IOC': ['Sports'],
  'PGA': ['Sports'],
  'ATP': ['Sports'],
  'WTA': ['Sports'],

  // Space & Astronomy
  'NASA': ['Space & Astronomy'],
  'ESA': ['Space & Astronomy'],
  'ISS': ['Space & Astronomy'],
  'JPL': ['Space & Astronomy'],
};

/** Known organization name fragments → categories */
export const ORG_PATTERNS: Array<{ pattern: string; categories: string[] }> = [
  { pattern: 'world health organization', categories: ['Health & Medicine'] },
  { pattern: 'centers for disease control', categories: ['Health & Medicine'] },
  { pattern: 'national institutes of health', categories: ['Health & Medicine'] },
  { pattern: 'food and drug administration', categories: ['Health & Medicine'] },
  { pattern: 'european space agency', categories: ['Space & Astronomy'] },
  { pattern: 'international space station', categories: ['Space & Astronomy'] },
  { pattern: 'united nations', categories: ['Politics'] },
  { pattern: 'european union', categories: ['Politics'] },
  { pattern: 'world bank', categories: ['Finance'] },
  { pattern: 'federal reserve', categories: ['Finance'] },
  { pattern: 'securities and exchange', categories: ['Finance'] },
  { pattern: 'environmental protection agency', categories: ['Environment'] },
  { pattern: 'intergovernmental panel on climate', categories: ['Environment'] },
  { pattern: 'national football league', categories: ['Sports'] },
  { pattern: 'major league baseball', categories: ['Sports'] },
  { pattern: 'academy of motion picture', categories: ['Entertainment'] },
  { pattern: 'national park service', categories: ['Travel', 'Environment'] },
  { pattern: 'department of education', categories: ['Education'] },
  { pattern: 'supreme court', categories: ['Politics'] },
];

/**
 * Regex-based numeric/formula patterns that indicate categories.
 * Each pattern is compiled once when the module loads.
 */
export const NUMERIC_PATTERNS: Array<{
  regex: RegExp;
  categories: string[];
  label: string;
}> = [
  { regex: /\$[\d,.]+\s*(million|billion|trillion|[MBT])/gi, categories: ['Finance', 'Business'], label: 'currency-large' },
  { regex: /\$[\d,.]+/g, categories: ['Finance'], label: 'currency' },
  { regex: /\d+(\.\d+)?%/g, categories: ['Finance', 'Science'], label: 'percentage' },
  { regex: /p\s*[<>=]\s*0\.\d+/gi, categories: ['Science', 'Health & Medicine'], label: 'p-value' },
  { regex: /CI\s*[\[(]\s*\d/gi, categories: ['Science', 'Health & Medicine'], label: 'confidence-interval' },
  { regex: /[A-Z][a-z]?\d*[A-Z][a-z]?\d*/g, categories: ['Science'], label: 'chemical-formula' },
  { regex: /\d+\s*(mph|km\/h|m\/s)/gi, categories: ['Sports', 'Automotive'], label: 'speed' },
  { regex: /\d+\s*(calories|kcal|cal)/gi, categories: ['Food & Dining', 'Health & Medicine'], label: 'calorie' },
  { regex: /\d+\s*(light[- ]years?|parsecs?|AU)/gi, categories: ['Space & Astronomy'], label: 'astro-distance' },
];
