// Simple spell checking utility for search queries

// Common technical and academic terms that might not be in standard dictionaries
const CUSTOM_DICTIONARY = [
  'artificial', 'intelligence', 'machine', 'learning', 'neural', 'network',
  'quantum', 'computing', 'algorithm', 'blockchain', 'cryptocurrency',
  'biotechnology', 'nanotechnology', 'genomics', 'proteomics', 'bioinformatics',
  'neuroscience', 'psychology', 'sociology', 'anthropology', 'economics',
  'finance', 'healthcare', 'medicine', 'pharmaceutical', 'clinical',
  'research', 'analysis', 'methodology', 'statistical', 'empirical',
  'theoretical', 'experimental', 'computational', 'mathematical',
  'scientific', 'academic', 'scholarly', 'peer-reviewed', 'publication',
  'covid', 'pandemic', 'vaccine', 'virus', 'bacteria', 'pathogen',
  'climate', 'environmental', 'sustainability', 'renewable', 'energy',
  'technology', 'innovation', 'development', 'engineering', 'software',
  'hardware', 'database', 'programming', 'coding', 'debugging',
  'optimization', 'performance', 'scalability', 'architecture',
  'cybersecurity', 'encryption', 'authentication', 'authorization',
  'api', 'framework', 'library', 'repository', 'deployment',
  'microservices', 'containerization', 'kubernetes', 'docker',
  'aws', 'azure', 'gcp', 'cloud', 'serverless', 'devops'
];

// Common typos and their corrections for technical terms
const COMMON_TYPOS: Record<string, string> = {
  'artifical': 'artificial',
  'artficial': 'artificial',
  'machien': 'machine',
  'machin': 'machine',
  'learing': 'learning',
  'lerning': 'learning',
  'quantom': 'quantum',
  'quantam': 'quantum',
  'quatum': 'quantum',
  'algoritm': 'algorithm',
  'algorythm': 'algorithm',
  'algorithem': 'algorithm',
  'blockchian': 'blockchain',
  'blockhain': 'blockchain',
  'cryptocurency': 'cryptocurrency',
  'cryptocurreny': 'cryptocurrency',
  'neurosciene': 'neuroscience',
  'neurosciense': 'neuroscience',
  'psycholgy': 'psychology',
  'psycology': 'psychology',
  'technolgy': 'technology',
  'techology': 'technology',
  'developement': 'development',
  'devlopment': 'development',
  'enviroment': 'environment',
  'enviornment': 'environment',
  'sustainabilty': 'sustainability',
  'sustainablity': 'sustainability',
  'cybersecuirty': 'cybersecurity',
  'cybersecurty': 'cybersecurity',
  'optimizaton': 'optimization',
  'optimisation': 'optimization',
  'performace': 'performance',
  'preformance': 'performance'
};

// Calculate Levenshtein distance for similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }
  
  return matrix[str2.length]![str1.length]!;
}

// Find the best correction for a word
function findBestCorrection(word: string): string | null {
  const lowerWord = word.toLowerCase();
  
  // Check our common typos first
  if (COMMON_TYPOS[lowerWord]) {
    return COMMON_TYPOS[lowerWord]!;
  }
  
  // Check if it's in our custom dictionary (no correction needed)
  if (CUSTOM_DICTIONARY.includes(lowerWord)) {
    return null;
  }
  
  // Only suggest corrections for words that are at least 4 characters long
  // This prevents short words like "pie" from being incorrectly matched to "api"
  if (word.length < 4) {
    return null;
  }
  
  // Find the closest match in our custom dictionary
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  // Make the threshold more strict: max 2 character differences OR 20% of word length, whichever is smaller
  const maxDistance = Math.min(2, Math.floor(word.length * 0.2));
  
  for (const dictWord of CUSTOM_DICTIONARY) {
    const distance = levenshteinDistance(lowerWord, dictWord);
    if (distance < bestDistance && distance <= maxDistance && distance > 0) {
      bestDistance = distance;
      bestMatch = dictWord;
    }
  }
  
  return bestMatch;
}

// Correct a search query
export function correctSearchQuery(query: string): {
  originalQuery: string;
  correctedQuery: string | null;
  corrections: Array<{ original: string; corrected: string }>;
} {
  const words = query.toLowerCase().trim().split(/\s+/);
  const corrections: Array<{ original: string; corrected: string }> = [];
  const correctedWords: string[] = [];
  
  for (const word of words) {
    // Skip very short words and numbers
    if (word.length <= 2 || /^\d+$/.test(word)) {
      correctedWords.push(word);
      continue;
    }
    
    const correction = findBestCorrection(word);
    if (correction && correction !== word) {
      corrections.push({ original: word, corrected: correction });
      correctedWords.push(correction);
    } else {
      correctedWords.push(word);
    }
  }
  
  const correctedQuery = corrections.length > 0 ? correctedWords.join(' ') : null;
  
  return {
    originalQuery: query,
    correctedQuery,
    corrections
  };
}

// Get search variations including original and corrected queries
export function getSearchVariations(query: string): string[] {
  const result = correctSearchQuery(query);
  const variations = [result.originalQuery.toLowerCase()];
  
  if (result.correctedQuery && result.correctedQuery !== result.originalQuery.toLowerCase()) {
    variations.push(result.correctedQuery);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}
