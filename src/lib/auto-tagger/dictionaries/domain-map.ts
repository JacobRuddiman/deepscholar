/**
 * Maps ~70 known source domains to category names.
 * Used by the source-domain voting method.
 */
export const DOMAIN_MAP: Record<string, string[]> = {
  // Technology
  'github.com': ['Technology'],
  'stackoverflow.com': ['Technology'],
  'techcrunch.com': ['Technology'],
  'arstechnica.com': ['Technology'],
  'wired.com': ['Technology'],
  'theverge.com': ['Technology', 'Entertainment'],
  'hackerrank.com': ['Technology'],
  'developer.mozilla.org': ['Technology'],
  'docs.microsoft.com': ['Technology'],
  'cloud.google.com': ['Technology'],

  // Science
  'nature.com': ['Science'],
  'science.org': ['Science'],
  'sciencedirect.com': ['Science'],
  'arxiv.org': ['Science', 'Technology'],
  'plos.org': ['Science'],
  'frontiersin.org': ['Science'],
  'springer.com': ['Science'],
  'wiley.com': ['Science'],
  'researchgate.net': ['Science'],

  // Health & Medicine
  'nih.gov': ['Health & Medicine'],
  'pubmed.ncbi.nlm.nih.gov': ['Health & Medicine'],
  'who.int': ['Health & Medicine'],
  'cdc.gov': ['Health & Medicine'],
  'mayoclinic.org': ['Health & Medicine'],
  'webmd.com': ['Health & Medicine'],
  'nejm.org': ['Health & Medicine'],
  'thelancet.com': ['Health & Medicine'],
  'bmj.com': ['Health & Medicine'],
  'medscape.com': ['Health & Medicine'],

  // Business
  'hbr.org': ['Business'],
  'forbes.com': ['Business', 'Finance'],
  'inc.com': ['Business'],
  'fastcompany.com': ['Business'],
  'entrepreneur.com': ['Business'],

  // Finance
  'bloomberg.com': ['Finance'],
  'reuters.com': ['Finance', 'Politics'],
  'wsj.com': ['Finance', 'Business'],
  'ft.com': ['Finance'],
  'investopedia.com': ['Finance'],
  'marketwatch.com': ['Finance'],
  'cnbc.com': ['Finance', 'Business'],
  'sec.gov': ['Finance'],

  // Education
  'ed.gov': ['Education'],
  'edx.org': ['Education'],
  'coursera.org': ['Education'],
  'khanacademy.org': ['Education'],

  // Politics
  'congress.gov': ['Politics'],
  'whitehouse.gov': ['Politics'],
  'politico.com': ['Politics'],
  'bbc.com': ['Politics'],

  // Environment
  'epa.gov': ['Environment'],
  'ipcc.ch': ['Environment'],
  'unep.org': ['Environment'],
  'worldwildlife.org': ['Environment'],
  'greenpeace.org': ['Environment'],

  // Arts & Culture
  'moma.org': ['Arts & Culture'],
  'metmuseum.org': ['Arts & Culture'],
  'smithsonianmag.com': ['Arts & Culture', 'History'],

  // Sports
  'espn.com': ['Sports'],
  'nba.com': ['Sports'],
  'nfl.com': ['Sports'],
  'fifa.com': ['Sports'],
  'olympics.com': ['Sports'],

  // Entertainment
  'imdb.com': ['Entertainment'],
  'rottentomatoes.com': ['Entertainment'],
  'variety.com': ['Entertainment'],
  'hollywoodreporter.com': ['Entertainment'],

  // Space & Astronomy
  'nasa.gov': ['Space & Astronomy'],
  'esa.int': ['Space & Astronomy'],
  'spacex.com': ['Space & Astronomy'],
  'space.com': ['Space & Astronomy'],

  // History
  'history.com': ['History'],
  'britannica.com': ['History', 'Science'],

  // Psychology
  'apa.org': ['Psychology'],
  'psychologytoday.com': ['Psychology'],
};
