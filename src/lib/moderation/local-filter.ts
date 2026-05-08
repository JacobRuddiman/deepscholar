/**
 * Local profanity/hate-speech filter using the `obscenity` package.
 *
 * Configured with a research whitelist to avoid false positives on
 * anatomical, medical, conflict, and substance-research terminology.
 */

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  DataSet,
} from 'obscenity';

/** Terms commonly used in research that should not trigger the filter */
const RESEARCH_WHITELIST = [
  // Anatomical / medical
  'breast', 'breasts', 'penis', 'vagina', 'vulva', 'uterus', 'ovary',
  'testis', 'testes', 'testicle', 'testicles', 'prostate', 'rectum',
  'mastectomy', 'circumcision', 'vasectomy', 'hysterectomy',
  'erectile', 'orgasm', 'ejaculation', 'menstruation', 'ovulation',
  'genitalia', 'genital', 'cervix', 'labia', 'scrotum', 'mammary',
  'puberty', 'pubic', 'copulation', 'coitus', 'reproductive',
  // Conflict / political research
  'kill', 'killing', 'killed', 'murder', 'murdered', 'homicide',
  'suicide', 'casualties', 'fatalities', 'genocide', 'massacre',
  'assassination', 'execution', 'torture', 'terrorism', 'terrorist',
  'extremism', 'extremist', 'radicalization', 'insurgent', 'insurgency',
  // Substance research
  'cocaine', 'heroin', 'methamphetamine', 'opioid', 'cannabis',
  'marijuana', 'morphine', 'fentanyl', 'amphetamine', 'hallucinogen',
  'psychedelic', 'narcotic', 'opium',
  // Biological / epidemiological
  'infection', 'viral', 'pathogen', 'contagion', 'mortality',
  'morbidity', 'epidemic', 'pandemic',
];

/**
 * Build the obscenity matcher with whitelisted terms removed.
 */
function buildMatcher(): RegExpMatcher {
  // Clone the English dataset and add whitelist phrases
  const dataset = new DataSet()
    .addAll(englishDataset);

  // Add whitelist phrases so obscenity won't flag them
  for (const term of RESEARCH_WHITELIST) {
    dataset.addPhrase((phrase) =>
      phrase
        .setMetadata({ originalWord: term, isWhitelisted: true })
        .addWhitelistedTerm(term)
    );
  }

  return new RegExpMatcher({
    ...dataset.build(),
    ...englishRecommendedTransformers,
  });
}

let _matcher: RegExpMatcher | null = null;

function getMatcher(): RegExpMatcher {
  if (!_matcher) {
    _matcher = buildMatcher();
  }
  return _matcher;
}

export interface LocalFilterResult {
  flagged: boolean;
  matchCount: number;
}

/**
 * Run the local obscenity filter on text.
 * Returns whether any matches were found (after whitelist exclusion).
 */
export function runLocalFilter(text: string): LocalFilterResult {
  const matcher = getMatcher();
  const matches = matcher.getAllMatches(text);

  return {
    flagged: matches.length > 0,
    matchCount: matches.length,
  };
}
