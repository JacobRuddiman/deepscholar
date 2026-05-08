/**
 * Quick test script for the auto-tagger ensemble voting system.
 * Usage: npx tsx scripts/test-auto-tagger.ts
 */

import { autoTagBrief } from '../src/lib/auto-tagger';
import type { TagInput } from '../src/lib/auto-tagger';

// ── Test cases ──────────────────────────────────────────────────

const testCases: Array<{ name: string; input: TagInput; expected: string[] }> = [
  {
    name: 'Xylia Wood (ChatGPT research sample)',
    expected: ['Science', 'Environment'],
    input: {
      title: 'Xylia Wood: Comprehensive Research Analysis',
      prompt: 'Research xylia wood, I want to know everything about it',
      abstract: 'Xylia is a genus of tropical legumes comprising approximately 12 species, with Xylia xylocarpa being the most commercially significant.',
      response: `<h2>Introduction</h2>
<p>Xylia is a genus of tropical legumes (family Fabaceae, subfamily Caesalpinioideae) comprising approximately 12 species, with Xylia xylocarpa being the most commercially significant. The wood, commonly known as "pyinkado" in Myanmar and "jambu" in Malaysia, is highly valued for its exceptional durability and strength.</p>
<h2>Physical Characteristics</h2>
<p>Xylia xylocarpa is a deciduous tree that can reach heights of 25-30 meters with trunk diameters up to 1.5 meters. The heartwood is dark red-brown to purple-brown. Density: 800-1000 kg/m³ (extremely dense). Hardness: Janka hardness of approximately 3,260 lbf.</p>
<h2>Distribution and Habitat</h2>
<p>Native to South and Southeast Asia, found in India, Myanmar, Thailand, Cambodia, Vietnam, Malaysia. The trees thrive in tropical monsoon climates.</p>
<h2>Sustainability Concerns</h2>
<p>Xylia xylocarpa faces conservation challenges due to over-exploitation. Listed in CITES. Slow growth rate (60-80 years). Habitat loss due to agricultural expansion. Illegal logging.</p>
<h2>Economic Importance</h2>
<p>In Myanmar, pyinkado represents one of the most valuable timber exports.</p>`,
      sourceUrls: [
        'https://en.wikipedia.org/wiki/Xylia',
        'http://www.fao.org/forestry/species/en/',
        'https://trade.cites.org/',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'Quantum Computing Error Correction (Perplexity sample)',
    expected: ['Technology', 'Science'],
    input: {
      title: 'Latest Developments in Quantum Computing Error Correction',
      prompt: 'What are the latest developments in quantum computing error correction?',
      abstract: 'Recent breakthroughs in quantum computing error correction have significantly advanced the field toward practical, fault-tolerant quantum computers.',
      response: `<h2>Surface Code Improvements</h2>
<p>Google's Quantum AI team achieved a major milestone demonstrating that increasing qubits in surface code reduced error rates. Their Willow quantum chip showed error rates decreasing by factor of 2 when scaling from 3x3 to 5x5 qubit arrays. Error correction suppresses errors exponentially with system size.</p>
<h2>New Error Correction Codes</h2>
<h3>Quantum Low-Density Parity-Check (QLDPC) Codes</h3>
<p>Researchers at MIT and Harvard made progress with QLDPC codes offering reduced qubit overhead compared to surface codes (potentially 10x fewer physical qubits needed).</p>
<h3>Floquet Codes</h3>
<p>A novel approach using time-periodic measurements. Dynamic error correction through periodic measurement sequences.</p>
<h2>Hardware-Specific Advances</h2>
<h3>Neutral Atom Systems</h3>
<p>QuEra and Atom Computing demonstrated error correction with 99.5% fidelity.</p>
<h3>Superconducting Qubits</h3>
<p>IBM developments include real-time error decoding using classical AI accelerators, gate fidelities approaching 99.9%.</p>
<h2>Machine Learning Integration</h2>
<p>Neural networks trained to identify quantum errors. Google DeepMind collaboration showing 30% improvement in logical error rates.</p>`,
      sourceUrls: [
        'https://www.nature.com/articles/s41586-023-06846-3',
        'https://news.mit.edu/2024/quantum-error-correction-ldpc',
        'https://research.ibm.com/blog/quantum-error-correction-2024',
        'https://www.nature.com/articles/s41567-023-02284-z',
        'https://www.quera.com/blog/error-correction-advances',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'Remote Work & Urban Real Estate (Claude sample)',
    expected: ['Real Estate', 'Business', 'Finance'],
    input: {
      title: 'The Economic Impact of Remote Work on Urban Real Estate Markets',
      prompt: 'Analyze the economic impact of remote work on urban real estate markets',
      abstract: 'The shift toward remote and hybrid work arrangements has fundamentally reshaped urban real estate markets, creating divergent outcomes across property types and metropolitan areas.',
      response: `<h2>Commercial Office Real Estate</h2>
<h3>Vacancy Rates and Valuation Declines</h3>
<p>San Francisco office vacancy reached 31.8% in Q3 2023. Manhattan vacancy rates climbed to 22.7%. These vacancies triggered 30-40% price reductions. Commercial real estate generates 20-30% of urban property tax income.</p>
<h2>Residential Market Dynamics</h2>
<h3>Urban Core Decline vs. Suburban Growth</h3>
<p>Rental price declines of 10-20%. Home prices in outer suburbs increased 15-25% faster. Demand surge for single-family homes with office spaces.</p>
<h3>Secondary City Renaissance</h3>
<p>Austin, Boise, Nashville saw 20-30% population growth. Remote workers arbitraged cost differences.</p>
<h2>Economic Multiplier Effects</h2>
<p>Downtown restaurants experienced 40-50% revenue declines. Business district retail saw 25% permanent closures. Public transit ridership 30-40% below pre-pandemic.</p>
<h2>Adaptive Reuse and Market Evolution</h2>
<p>Office-to-residential conversions. Conversion costs $200-400 per square foot. Mixed-use development shift.</p>`,
      sourceUrls: [
        'https://www.mckinsey.com/featured-insights/future-of-work',
        'https://www.nber.org/papers/w30446',
        'https://www.brookings.edu/articles/remote-work-urban-economics',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'Neural Plasticity (minimal format)',
    expected: ['Science', 'Health & Medicine', 'Psychology'],
    input: {
      title: 'Neural Plasticity in Adult Brains',
      prompt: 'Explain neural plasticity in adult brains and its implications',
      abstract: 'Neural plasticity refers to the brain\'s ability to reorganize itself by forming new neural connections throughout life.',
      response: `Neural plasticity, or neuroplasticity, refers to the brain's ability to reorganize itself by forming new neural connections throughout life. Contrary to earlier beliefs that the adult brain was relatively fixed, modern neuroscience has revealed substantial plasticity persists into old age.

Key mechanisms include synaptic plasticity (strengthening or weakening of synapses), neurogenesis (creation of new neurons particularly in the hippocampus), and cortical remapping (reassignment of neural resources).

Research shows that learning new skills, physical exercise, and environmental enrichment all promote neuroplastic changes. London taxi drivers show enlarged hippocampi. Musicians demonstrate enhanced auditory cortex development.

Clinical applications include stroke recovery protocols that leverage neuroplasticity through targeted rehabilitation. Constraint-induced movement therapy forces use of affected limbs. Similar principles apply to cognitive rehabilitation after traumatic brain injury.

Challenges remain in understanding the limits of plasticity. Age-related declines in plasticity mechanisms may explain reduced learning capacity in older adults, though cognitive training shows promise.`,
      sourceUrls: [],
      htmlContent: undefined,
    },
  },
  // Additional edge cases
  {
    name: 'Short/vague input (should produce few or no tags)',
    expected: [],
    input: {
      title: 'Quick thoughts',
      prompt: 'Tell me about stuff',
      abstract: '',
      response: 'Here are some random thoughts about various topics.',
      sourceUrls: [],
      htmlContent: undefined,
    },
  },
  {
    name: 'Climate Change (strong Environment signal)',
    expected: ['Environment'],
    input: {
      title: 'Climate Change and Carbon Emissions',
      prompt: 'What is the current state of climate change and greenhouse gas emissions?',
      abstract: 'Global carbon dioxide emissions reached 36.8 billion tonnes in 2023, with greenhouse gas concentrations at record levels.',
      response: `<h2>Global Warming Trends</h2>
<p>Climate change driven by fossil fuel combustion has raised global temperatures by 1.2°C above pre-industrial levels. Carbon dioxide emissions from coal, oil, and natural gas remain the primary driver. The IPCC warns that limiting warming to 1.5°C requires net zero emissions by 2050.</p>
<h2>Renewable Energy Transition</h2>
<p>Solar and wind energy capacity grew 50% in 2023. Renewable energy now provides 30% of global electricity. The transition away from fossil fuels accelerates but remains insufficient.</p>
<h2>Ecosystem Impacts</h2>
<p>Biodiversity loss, deforestation, coral reef bleaching, glacier retreat, sea level rise of 3.6mm/year. Endangered species face extinction from habitat loss. Sustainability efforts including reforestation and conservation programs are expanding.</p>
<h2>Policy Responses</h2>
<p>The Paris Agreement targets, carbon pricing mechanisms, EPA regulations, and ESG investing frameworks are shaping policy responses to the climate crisis.</p>`,
      sourceUrls: [
        'https://www.ipcc.ch/report/ar6/',
        'https://www.epa.gov/climate-indicators',
        'https://www.unep.org/resources/emissions-gap-report',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'NBA Basketball Analysis (Sports)',
    expected: ['Sports'],
    input: {
      title: 'NBA 2024 Playoff Analysis and Championship Predictions',
      prompt: 'Analyze the NBA playoff matchups and predict the championship',
      abstract: 'The 2024 NBA playoffs feature several compelling matchups with strong championship contenders.',
      response: `The NBA playoff tournament features sixteen teams competing for the championship. The Boston Celtics led the league with the best record. Key player matchups include star athletes competing in offense and defense. The coach's strategy and team roster depth will determine playoff success. Stadium attendance and television ratings for the games have reached new highs. The basketball league championship series promises exciting competition between the top-seeded teams. Historical scoring records may fall during this playoff season. The referee decisions and officiating have been under scrutiny. Teams have been adjusting their draft picks and training camp preparations. Olympic basketball players bring international experience to their NBA teams.`,
      sourceUrls: [
        'https://www.nba.com/playoffs',
        'https://www.espn.com/nba/',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'CRISPR Gene Editing (Science + Health cross-domain)',
    expected: ['Science', 'Health & Medicine'],
    input: {
      title: 'CRISPR Gene Editing: Breakthroughs in Treating Genetic Diseases',
      prompt: 'What are the latest breakthroughs in CRISPR gene editing for treating genetic diseases?',
      abstract: 'CRISPR-Cas9 gene editing technology has achieved landmark clinical results in treating sickle cell disease and beta-thalassemia.',
      response: `<h2>Clinical Breakthroughs</h2>
<p>The FDA approved the first CRISPR-based therapy, Casgevy, for sickle cell disease in December 2023. Clinical trial results showed 97% of patients achieved durable responses with no serious adverse events. The treatment modifies patient stem cells by editing the BCL11A gene to reactivate fetal hemoglobin production.</p>
<h2>Scientific Mechanism</h2>
<p>CRISPR-Cas9 works by using guide RNA to direct the Cas9 enzyme to specific DNA sequences for precise genome editing. Recent advances include base editing (modifying individual nucleotides without double-strand breaks) and prime editing (search-and-replace capability). Researchers have achieved 99.9% on-target accuracy with minimal off-target effects.</p>
<h2>Emerging Applications</h2>
<p>Beyond blood disorders, clinical trials are underway for hereditary angioedema, transthyretin amyloidosis, and certain cancers. In vivo CRISPR delivery (editing genes inside the body) has shown promise for liver diseases. Researchers at MIT developed lipid nanoparticle delivery systems targeting specific cell types.</p>`,
      sourceUrls: [
        'https://www.nature.com/articles/s41586-024-crispr',
        'https://www.nejm.org/doi/full/casgevy-trial',
        'https://www.nih.gov/news-events/crispr-approval',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'Space Exploration Mars Mission (Space & Astronomy)',
    expected: ['Space & Astronomy'],
    input: {
      title: 'NASA Artemis Program and the Road to Mars',
      prompt: 'What is NASA current plan for sending astronauts to Mars?',
      abstract: 'NASA Artemis program aims to return humans to the Moon as a stepping stone for crewed Mars missions in the late 2030s.',
      response: `NASA's Artemis program represents the next giant leap in space exploration. The Space Launch System rocket and Orion spacecraft successfully completed an uncrewed lunar orbit mission. Astronauts will land on the Moon's south pole to test technologies for Mars. SpaceX Starship is being developed as the lunar lander and potential Mars transit vehicle. The mission architecture includes a lunar Gateway space station in orbit around the Moon. Mars mission challenges include cosmic radiation exposure during the 7-month transit, landing a 40-ton payload on Mars, and sustaining crew for 500+ days on the surface. NASA and ESA are collaborating on Mars Sample Return to bring Perseverance rover samples back to Earth.`,
      sourceUrls: [
        'https://www.nasa.gov/artemis',
        'https://www.spacex.com/vehicles/starship/',
        'https://www.esa.int/mars-sample-return',
      ],
      htmlContent: undefined,
    },
  },
  {
    name: 'Cryptocurrency DeFi (Finance + Technology)',
    expected: ['Finance', 'Technology'],
    input: {
      title: 'Decentralized Finance: How DeFi is Reshaping the Financial System',
      prompt: 'Explain how decentralized finance DeFi works and its impact on traditional banking',
      abstract: 'Decentralized finance leverages blockchain technology to create permissionless financial services without intermediaries.',
      response: `<h2>How DeFi Works</h2>
<p>DeFi protocols use smart contracts on blockchain networks (primarily Ethereum) to replicate traditional financial services. Users can lend, borrow, trade, and earn interest on cryptocurrency assets without banks or brokers. Total value locked in DeFi protocols exceeded $50 billion in 2024.</p>
<h2>Key Protocols</h2>
<p>Lending platforms like Aave and Compound allow users to earn interest on deposits. Decentralized exchanges (DEXs) like Uniswap facilitate token trading via automated market makers. Yield farming and liquidity mining provide additional investment returns.</p>
<h2>Impact on Traditional Finance</h2>
<p>Banks are losing market share in lending and payment processing. The SEC has increased regulatory scrutiny of DeFi protocols. Central banks are developing digital currencies (CBDCs) as a response. Investment firms are allocating portfolio portions to crypto derivatives and DeFi yield strategies.</p>`,
      sourceUrls: [
        'https://www.coindesk.com/defi-explained',
        'https://www.sec.gov/crypto-regulation',
        'https://www.bloomberg.com/defi-market',
      ],
      htmlContent: undefined,
    },
  },
];

// ── Runner ──────────────────────────────────────────────────────

function printSeparator() {
  console.log('─'.repeat(70));
}

console.log('\n🏷️  AUTO-TAGGER TEST RESULTS\n');
printSeparator();

for (const tc of testCases) {
  const result = autoTagBrief(tc.input);

  const tagDisplay = result.categories.length > 0
    ? result.categories.join(', ')
    : '(none)';

  const matchesExpected = tc.expected.length === 0
    ? result.categories.length === 0
    : tc.expected.some(e => result.categories.includes(e));

  const status = matchesExpected ? '✅' : '⚠️';

  console.log(`\n${status} ${tc.name}`);
  console.log(`   Tags:     ${tagDisplay}`);
  console.log(`   Expected: ${tc.expected.length > 0 ? tc.expected.join(', ') : '(none/few)'}`);
  console.log(`   Time:     ${result.elapsed.toFixed(1)}ms`);

  // Show top scores
  const sortedScores = Object.entries(result.scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  if (sortedScores.length > 0) {
    console.log(`   Top scores:`);
    for (const [cat, score] of sortedScores) {
      const voters = result.methodBreakdown.filter(m =>
        m.votes.some(v => v.category === cat && v.score >= 0.15)
      ).length;
      console.log(`     ${cat}: ${score.toFixed(2)} (${voters} methods voted)`);
    }
  }

  printSeparator();
}

console.log('\nDone.\n');
