/**
 * Method 7: Prompt Intent
 * Classifies user prompt via regex patterns that detect intent/topic.
 * Direct signal from what the user actually asked about.
 */

import type { CategoryVote, TagInput } from '../types';

/** Intent patterns: regex → categories with confidence */
const INTENT_PATTERNS: Array<{
  regex: RegExp;
  categories: string[];
  boost: number;
}> = [
  // Technology
  { regex: /\b(?:how|what|why)\b.*\b(?:code|program|software|app|website|api|database)\b/i, categories: ['Technology'], boost: 0.5 },
  { regex: /\b(?:build|create|develop|deploy|debug)\b.*\b(?:app|application|service|system)\b/i, categories: ['Technology'], boost: 0.4 },
  { regex: /\b(?:machine learning|deep learning|neural|ai|artificial intelligence)\b/i, categories: ['Technology'], boost: 0.5 },
  { regex: /\b(?:quantum computing|quantum computer|qubit|error correction|fault.tolerant)\b/i, categories: ['Technology'], boost: 0.5 },

  // Science
  { regex: /\b(?:how|why|what)\b.*\b(?:work|happen|cause|mechanism|process)\b.*\b(?:cell|atom|molecule|gene|particle|reaction)\b/i, categories: ['Science'], boost: 0.5 },
  { regex: /\b(?:explain|describe)\b.*\b(?:theory|law|principle|phenomenon)\b/i, categories: ['Science'], boost: 0.4 },
  { regex: /\b(?:explain|describe|what)\b.*\b(?:neural|neuron|synapse|plasticity|cortex|cortical)\b/i, categories: ['Science'], boost: 0.4 },

  // Health & Medicine
  { regex: /\b(?:treat|cure|diagnose|prevent|symptom|cause)\b.*\b(?:disease|cancer|infection|condition|illness|disorder)\b/i, categories: ['Health & Medicine'], boost: 0.5 },
  { regex: /\b(?:how|what)\b.*\b(?:affect|impact)\b.*\b(?:health|body|brain|heart|lung|liver)\b/i, categories: ['Health & Medicine'], boost: 0.5 },
  { regex: /\b(?:medication|drug|vaccine|therapy|dosage|side effect)\b/i, categories: ['Health & Medicine'], boost: 0.4 },
  { regex: /\b(?:stroke|rehabilitation|brain injury|traumatic brain|clinical applications)\b/i, categories: ['Health & Medicine'], boost: 0.4 },

  // Business
  { regex: /\b(?:how|what|why)\b.*\b(?:company|business|startup|market|industry|brand)\b/i, categories: ['Business'], boost: 0.4 },
  { regex: /\b(?:grow|scale|monetize|launch|manage)\b.*\b(?:business|company|startup|product)\b/i, categories: ['Business'], boost: 0.5 },

  // Finance
  { regex: /\b(?:invest|save|budget|retire|tax|stock|bond|crypto|portfolio)\b/i, categories: ['Finance'], boost: 0.4 },
  { regex: /\b(?:how|what|why)\b.*\b(?:economy|inflation|recession|gdp|interest rate)\b/i, categories: ['Finance'], boost: 0.5 },

  // Education
  { regex: /\b(?:learn|teach|study|curriculum|education|school|university|college)\b/i, categories: ['Education'], boost: 0.4 },
  { regex: /\b(?:how|what)\b.*\b(?:teach|learn|study|educate)\b/i, categories: ['Education'], boost: 0.4 },

  // Politics
  { regex: /\b(?:government|policy|law|regulation|election|vote|congress|parliament)\b/i, categories: ['Politics'], boost: 0.4 },
  { regex: /\b(?:how|what|why)\b.*\b(?:political|geopolitical|foreign policy|legislation)\b/i, categories: ['Politics'], boost: 0.5 },

  // Environment
  { regex: /\b(?:climate|carbon|emission|pollution|renewable|sustainability|endangered)\b/i, categories: ['Environment'], boost: 0.4 },
  { regex: /\b(?:how|what|why)\b.*\b(?:environment|ecosystem|biodiversity|warming|pollution)\b/i, categories: ['Environment'], boost: 0.5 },

  // Space & Astronomy
  { regex: /\b(?:planet|star|galaxy|universe|orbit|space|astronaut|rocket|nasa)\b/i, categories: ['Space & Astronomy'], boost: 0.4 },
  { regex: /\b(?:how|what|why)\b.*\b(?:planet|star|galaxy|universe|cosmos|solar system)\b/i, categories: ['Space & Astronomy'], boost: 0.5 },

  // Psychology
  { regex: /\b(?:psychology|mental health|cognitive|behavioral|emotional|anxiety|depression|therapy)\b/i, categories: ['Psychology'], boost: 0.4 },
  { regex: /\b(?:how|why)\b.*\b(?:brain|mind|think|feel|behave|perceive|remember)\b/i, categories: ['Psychology'], boost: 0.4 },
  { regex: /\b(?:neural plasticity|neuroplasticity|brain plasticity|cognitive training|brain reorganiz)\b/i, categories: ['Psychology'], boost: 0.5 },

  // Philosophy
  { regex: /\b(?:ethics|morality|meaning|existence|consciousness|free will|truth|justice)\b/i, categories: ['Philosophy'], boost: 0.4 },
  { regex: /\b(?:what|why|how)\b.*\b(?:ethical|moral|philosophical|meaning of life)\b/i, categories: ['Philosophy'], boost: 0.5 },

  // History
  { regex: /\b(?:history|historical|ancient|medieval|century|era|civilization|empire|dynasty)\b/i, categories: ['History'], boost: 0.4 },
  { regex: /\b(?:what|how|why)\b.*\b(?:happened|led to|caused)\b.*\b(?:war|revolution|fall|rise)\b/i, categories: ['History'], boost: 0.5 },

  // Sports
  { regex: /\b(?:team|player|game|match|season|championship|league|coach)\b/i, categories: ['Sports'], boost: 0.3 },
  { regex: /\b(?:who|what|how)\b.*\b(?:win|score|play|compete)\b/i, categories: ['Sports'], boost: 0.3 },

  // Entertainment
  { regex: /\b(?:movie|film|show|series|album|song|game|streaming)\b/i, categories: ['Entertainment'], boost: 0.3 },

  // Food & Dining
  { regex: /\b(?:recipe|cook|bake|ingredient|cuisine|restaurant|nutrition|diet)\b/i, categories: ['Food & Dining'], boost: 0.4 },

  // Travel
  { regex: /\b(?:travel|destination|tourist|vacation|flight|hotel|resort|sightseeing)\b/i, categories: ['Travel'], boost: 0.4 },

  // Fashion
  { regex: /\b(?:fashion|style|designer|couture|trend|wardrobe|outfit|clothing)\b/i, categories: ['Fashion'], boost: 0.4 },

  // Real Estate
  { regex: /\b(?:property|mortgage|rental|housing|apartment|real estate|landlord)\b/i, categories: ['Real Estate'], boost: 0.4 },

  // Automotive
  { regex: /\b(?:car|vehicle|electric vehicle|engine|driving|automotive|tesla|ev)\b/i, categories: ['Automotive'], boost: 0.4 },
];

export function promptIntent(input: TagInput): CategoryVote[] {
  const prompt = input.prompt;
  if (!prompt || prompt.length < 5) return [];

  const categoryScores = new Map<string, number>();

  for (const { regex, categories, boost } of INTENT_PATTERNS) {
    if (regex.test(prompt)) {
      for (const cat of categories) {
        const current = categoryScores.get(cat) ?? 0;
        categoryScores.set(cat, Math.min(1.0, current + boost));
      }
    }
  }

  // Also check title — it often captures intent
  const title = input.title;
  if (title && title.length > 3) {
    for (const { regex, categories, boost } of INTENT_PATTERNS) {
      if (regex.test(title)) {
        for (const cat of categories) {
          const current = categoryScores.get(cat) ?? 0;
          categoryScores.set(cat, Math.min(1.0, current + boost * 0.7));
        }
      }
    }
  }

  const votes: CategoryVote[] = [];
  for (const [category, score] of categoryScores) {
    votes.push({ category, score });
  }

  return votes;
}
