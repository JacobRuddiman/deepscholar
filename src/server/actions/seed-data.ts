// app/actions/seed-data.ts

export const categories = [
  'Technology',
  'Science',
  'Health & Medicine',
  'Business',
  'Finance',
  'Education',
  'Politics',
  'Environment',
  'Arts & Culture',
  'Sports',
  'Entertainment',
  'Travel',
  'Food & Dining',
  'Fashion',
  'Real Estate',
  'Automotive',
  'Psychology',
  'Philosophy',
  'History',
  'Space & Astronomy',
];

export const categoryDescriptions = [
  'Explore cutting-edge developments and innovations in this field',
  'Comprehensive insights and analysis on trending topics',
  'Expert perspectives and research-backed information',
  'Stay informed with the latest updates and discoveries',
  'Deep dives into complex subjects made accessible',
];

export const sourceTitles = [
  // Academic Journals (15)
  'Nature Scientific Journal',
  'Science Magazine',
  'The Lancet Medical Journal',
  'New England Journal of Medicine',
  'Proceedings of the National Academy of Sciences',
  'Cell Press Journals',
  'JAMA (Journal of the American Medical Association)',
  'Nature Medicine',
  'Physical Review Letters',
  'The BMJ (British Medical Journal)',
  'Nature Biotechnology',
  'Science Advances',
  'Nature Climate Change',
  'Neuron Journal',
  'Annual Review of Neuroscience',

  // News Publications (15)
  'The New York Times',
  'The Guardian',
  'The Washington Post',
  'BBC News',
  'Reuters News Agency',
  'The Wall Street Journal',
  'Financial Times',
  'The Economist',
  'Bloomberg News',
  'Associated Press',
  'NPR (National Public Radio)',
  'The Atlantic',
  'Wired Magazine',
  'MIT Technology Review',
  'Scientific American',

  // Research Institutions (15)
  'Stanford Research Papers',
  'Harvard Medical School Publications',
  'MIT Media Lab Reports',
  'Oxford Academic Press',
  'Cambridge University Research',
  'Max Planck Institute Studies',
  'National Institutes of Health (NIH)',
  'World Health Organization Reports',
  'Brookings Institution Papers',
  'RAND Corporation Studies',
  'Carnegie Mellon Research',
  'Berkeley Lab Publications',
  'Princeton University Press',
  'Yale Research Initiative',
  'Johns Hopkins Medicine Research',

  // Specialty Publications (15)
  'Nature Geoscience',
  'The Astrophysical Journal',
  'Journal of Climate',
  'Environmental Science & Technology',
  'IEEE Spectrum',
  'Communications of the ACM',
  'Journal of Machine Learning Research',
  'Artificial Intelligence Journal',
  'Harvard Business Review',
  'McKinsey Quarterly',
  'Deloitte Insights',
  'Journal of Finance',
  'American Economic Review',
  'Foreign Affairs Magazine',
  'National Geographic',
];

export const briefTitles = [
  // Technology (20 titles)
  'The Future of Quantum Computing: A Comprehensive Analysis',
  'Blockchain Technology Beyond Cryptocurrency',
  'Artificial Intelligence in Healthcare: Current Applications and Future Prospects',
  'The Evolution of 5G Networks and Their Impact on IoT',
  'Cybersecurity Trends: Protecting Against Next-Generation Threats',
  'Edge Computing vs Cloud Computing: Performance and Use Cases',
  'The Rise of Neuromorphic Computing: Brain-Inspired Processors',
  'Augmented Reality in Enterprise: Transforming Business Operations',
  'Natural Language Processing: Breaking Communication Barriers',
  'Robotics Process Automation: Reshaping the Workforce',
  'Quantum Cryptography: The Future of Secure Communication',
  'Neural Networks and Deep Learning: Recent Breakthroughs',
  'The Internet of Things: Security Challenges and Solutions',
  'Virtual Reality in Education and Training Applications',
  'Autonomous Vehicles: Technical Challenges and Regulatory Frameworks',
  'Distributed Ledger Technology in Supply Chain Management',
  'Machine Learning for Predictive Maintenance in Manufacturing',
  '3D Printing Revolution: From Prototyping to Production',
  'Biometric Authentication Systems: Privacy and Security Considerations',
  'Software-Defined Networking: Transforming IT Infrastructure',

  // Science (20 titles)
  'Climate Change Impact on Global Food Security',
  'The Role of Microbiome in Human Health',
  'Gene Editing Ethics: CRISPR and Beyond',
  'Neuroscience of Learning: Optimizing Educational Methods',
  'Dark Matter and Dark Energy: Current Research and Theories',
  'CRISPR Technology: Applications in Medicine and Agriculture',
  'Particle Physics: Recent Discoveries at the Large Hadron Collider',
  'Synthetic Biology: Engineering Living Systems',
  'Epigenetics: How Environment Shapes Gene Expression',
  'Ocean Acidification: Effects on Marine Ecosystems',
  'Stem Cell Research: Therapeutic Applications and Controversies',
  'The Human Connectome Project: Mapping Brain Networks',
  'Exoplanet Discovery: Methods and Recent Findings',
  'Nanotechnology in Medicine: Targeted Drug Delivery Systems',
  'Gravitational Waves: Detection and Astronomical Implications',
  'The Microplastics Crisis: Environmental and Health Impacts',
  'Neuroplasticity: How the Brain Adapts and Rewires',
  'Antibiotic Resistance: A Global Health Emergency',
  'Photosynthesis Optimization: Engineering Better Crops',
  'Telomeres and Aging: Understanding Cellular Senescence',

  // Health & Medicine (20 titles)
  'Mental Health in the Digital Age: Challenges and Solutions',
  'Precision Medicine: Tailoring Treatment to Individual Genetics',
  'Immunotherapy: Revolutionizing Cancer Treatment',
  'The Gut-Brain Axis: Influence of Microbiota on Mental Health',
  'Telemedicine: Accessibility, Efficacy, and Future Prospects',
  'Alzheimer\'s Disease: Latest Research and Treatment Approaches',
  'mRNA Vaccine Technology: Beyond COVID-19 Applications',
  'Cardiovascular Disease Prevention: Lifestyle and Genetic Factors',
  'Mental Health Stigma: Societal Impact and Reduction Strategies',
  'Regenerative Medicine: Tissue Engineering and Organ Replacement',
  'The Obesity Epidemic: Causes, Consequences, and Interventions',
  'Personalized Nutrition: Genetic Testing for Dietary Optimization',
  'Chronic Pain Management: New Approaches Beyond Opioids',
  'Sleep Science: Understanding Circadian Rhythms and Health',
  'Maternal and Child Health in Developing Countries',
  'Gene Therapy: Clinical Applications and Success Stories',
  'The Longevity Revolution: Science of Healthy Aging',
  'Digital Therapeutics: Apps and Devices as Medical Treatments',
  'Autoimmune Diseases: Triggers, Mechanisms, and Treatments',
  'Pandemic Preparedness: Lessons from COVID-19',

  // Business & Economics (20 titles)
  'The Psychology of Decision Making in Financial Markets',
  'The Economics of Electric Vehicle Adoption',
  'Sustainable Urban Development: Smart Cities of Tomorrow',
  'The Gig Economy: Impact on Labor Markets and Worker Rights',
  'Corporate Governance in the 21st Century: Stakeholder Capitalism',
  'Behavioral Economics: Nudges and Public Policy',
  'The Future of Retail: Omnichannel Strategies and Experience',
  'Cryptocurrency Markets: Volatility, Regulation, and Adoption',
  'Supply Chain Resilience: Lessons from Global Disruptions',
  'ESG Investing: Environmental, Social, and Governance Metrics',
  'The Sharing Economy: Economic and Social Implications',
  'Digital Transformation in Banking: Fintech and Traditional Finance',
  'Remote Work Economics: Productivity, Real Estate, and Urban Planning',
  'Circular Economy Models: Sustainability and Profitability',
  'Income Inequality: Trends, Causes, and Policy Solutions',
  'Venture Capital in Emerging Markets: Opportunities and Risks',
  'The Creator Economy: Monetization and Platform Dynamics',
  'Trade Wars and Globalization: Economic Impacts and Future Trends',
  'Universal Basic Income: Experiments and Economic Analysis',
  'The Economics of Attention: Digital Advertising and Consumer Behavior',

  // Social Sciences & Politics (20 titles)
  'Social Media Impact on Democratic Processes',
  'The Evolution of Remote Work Culture Post-Pandemic',
  'Migration Patterns in the 21st Century: Causes and Consequences',
  'Polarization in Modern Democracies: Media and Echo Chambers',
  'Educational Inequality: Access, Quality, and Outcomes',
  'The Psychology of Conspiracy Theories and Misinformation',
  'Gender Equality in the Workplace: Progress and Persistent Challenges',
  'Criminal Justice Reform: Recidivism Reduction Strategies',
  'The Impact of Social Networks on Mental Health and Well-being',
  'Urban Sociology: Gentrification and Community Displacement',
  'Political Economy of Climate Action: Barriers and Opportunities',
  'The Role of Media in Shaping Public Opinion',
  'Populism: Rise, Rhetoric, and Democratic Implications',
  'Digital Divide: Technology Access and Social Equity',
  'Sociology of Religion in Secular Societies',
  'The Future of Democracy: Digital Participation and Governance',
  'Human Rights in the Digital Age: Privacy and Surveillance',
  'The Psychology of Extremism and Radicalization',
  'Youth Unemployment: Economic and Social Consequences',
  'Cultural Globalization: Homogenization vs Diversity',

  // Environment & Sustainability (20 titles)
  'Renewable Energy Technologies: Cost-Benefit Analysis 2024',
  'Biodiversity Loss: Ecosystem Services and Conservation Strategies',
  'Carbon Capture and Storage: Technologies and Deployment',
  'Sustainable Agriculture: Balancing Food Security and Environment',
  'Deforestation in the Amazon: Drivers and Global Impact',
  'Water Scarcity: Technologies and Policy Solutions',
  'Plastic Pollution in Oceans: Sources and Remediation',
  'Green Building Design: Energy Efficiency and Sustainability',
  'Electric Grid Modernization: Integrating Renewable Energy',
  'Climate Adaptation Strategies for Coastal Communities',
  'Sustainable Fashion: Environmental Impact of Fast Fashion',
  'Wildlife Conservation: Balancing Human Development and Habitats',
  'Nuclear Energy Renaissance: Safety, Waste, and Climate Benefits',
  'Urban Heat Islands: Causes, Effects, and Mitigation',
  'Sustainable Transportation: Infrastructure for Zero-Emission Mobility',
  'Soil Degradation: Agricultural Practices and Restoration',
  'Green Hydrogen: Production Methods and Economic Viability',
  'Ecosystem Restoration: Rewilding and Habitat Rehabilitation',
  'Climate Finance: Funding the Transition to Net Zero',
  'E-Waste Management: Recycling and Circular Economy Solutions',
];

export const briefPrompts = [
  'Analyze the current state and future implications of this technology',
  'What are the key challenges and opportunities in this field?',
  'Provide a comprehensive overview with supporting evidence',
  'Examine the societal impact and ethical considerations',
  'Compare different approaches and methodologies in this area',
];

export const briefResponses = [
  `This comprehensive analysis reveals several key insights that reshape our understanding of the subject matter. Through extensive research and data analysis, we can identify three primary factors that drive current trends.

First, technological advancement has accelerated beyond initial projections, creating new opportunities for innovation while simultaneously presenting unprecedented challenges. The integration of artificial intelligence and machine learning has fundamentally altered traditional approaches, leading to more efficient and scalable solutions.

Second, economic considerations play a crucial role in determining adoption rates and implementation strategies. Cost-benefit analyses indicate that early adopters gain significant competitive advantages, though initial investment requirements remain a barrier for smaller organizations. Market dynamics suggest a gradual shift toward more accessible pricing models.

Third, regulatory frameworks are evolving to address emerging concerns while fostering innovation. Policymakers face the delicate balance of protecting consumer interests without stifling technological progress. Recent legislative developments indicate a trend toward more nuanced, sector-specific regulations.`,

  `Our investigation into this complex topic reveals a multifaceted landscape of interconnected factors and emerging trends. The evidence suggests a paradigm shift in how we approach fundamental challenges in this domain.

The research methodology employed comprehensive data collection from multiple sources, including peer-reviewed studies, industry reports, and expert interviews. Statistical analysis confirms significant correlations between key variables, supporting our hypothesis about underlying mechanisms.

Environmental factors contribute substantially to observed outcomes, with climate considerations becoming increasingly central to strategic planning. Sustainability metrics now inform decision-making processes across all sectors, reflecting a broader societal shift toward long-term thinking.

Human factors remain critical, with behavioral patterns and cultural contexts shaping adoption and implementation. Educational initiatives and public awareness campaigns demonstrate measurable impact on outcomes, suggesting the importance of continued investment in knowledge dissemination.`,

  `This detailed examination provides crucial insights into contemporary challenges and future opportunities. Our analysis synthesizes current research with practical applications to offer actionable recommendations.

Market analysis reveals shifting consumer preferences driven by technological advancement and changing social values. Digital transformation accelerates across industries, creating new business models while disrupting traditional approaches. Companies that successfully navigate this transition demonstrate common characteristics: agility, customer-centricity, and strategic innovation.

Scientific breakthroughs continue to expand possibilities, with interdisciplinary collaboration yielding unexpected discoveries. Recent developments in materials science, biotechnology, and quantum computing converge to create novel solutions for longstanding problems. The pace of innovation suggests we are entering a period of exponential growth in capabilities.

Global cooperation becomes increasingly essential as challenges transcend national boundaries. International frameworks and collaborative initiatives show promise, though implementation remains uneven. Success stories from various regions provide templates for effective approaches, emphasizing the importance of cultural adaptation and local engagement.`,

  `Through rigorous analysis of available data and expert perspectives, this research presents a comprehensive view of current developments and future trajectories. The findings challenge conventional wisdom while confirming certain fundamental principles.

Technological integration transforms traditional practices, creating efficiencies while raising new questions about privacy, security, and ethical boundaries. Organizations must balance innovation with responsibility, developing frameworks that protect stakeholder interests while enabling progress. Best practices emerge from leaders who prioritize transparency and accountability.

Economic implications extend beyond immediate financial considerations to encompass broader societal impacts. Investment patterns reflect growing awareness of environmental, social, and governance factors. Long-term value creation increasingly depends on sustainable practices and stakeholder alignment. Market mechanisms evolve to reward responsible innovation while penalizing short-term thinking.

Social dynamics play an increasingly important role in shaping outcomes. Community engagement and participatory approaches yield superior results compared to top-down implementations. Cultural sensitivity and inclusive design principles become essential for successful deployment. The democratization of technology creates opportunities for previously marginalized groups while presenting challenges for existing power structures.`,

  `This comprehensive study examines critical factors shaping contemporary developments in this rapidly evolving field. Our findings highlight the complex interplay between technological innovation, societal needs, and regulatory frameworks.

Data analysis reveals significant trends that warrant careful consideration by stakeholders across sectors. Quantitative metrics demonstrate measurable progress in key areas, while qualitative assessments provide nuanced understanding of underlying dynamics. The convergence of multiple factors creates both opportunities and challenges requiring adaptive strategies.

Implementation case studies offer valuable lessons for organizations navigating this landscape. Successful initiatives share common elements: strong leadership, clear vision, stakeholder buy-in, and iterative improvement processes. Failures often stem from inadequate planning, resistance to change, or misalignment between objectives and resources. These insights inform best practices for future endeavors.

Future projections based on current trajectories suggest continued evolution and disruption. Emerging technologies promise to accelerate transformation while creating new complexities. Organizations must develop resilience and adaptability to thrive in this dynamic environment. Strategic planning should account for multiple scenarios and maintain flexibility to respond to unexpected developments.`,

  // Additional varied responses for more diversity
  `Recent developments in this field represent a significant departure from previous approaches. Empirical research demonstrates measurable improvements across key performance indicators. The convergence of multiple technological advances creates unprecedented opportunities for innovation.

Stakeholders must navigate complex trade-offs between competing objectives. Short-term implementation costs are offset by long-term efficiency gains and risk reduction. Early evidence suggests that organizations adopting these approaches gain substantial competitive advantages.

Critical success factors include leadership commitment, adequate resource allocation, and organizational culture supportive of change. Resistance to adoption stems primarily from knowledge gaps and risk aversion rather than fundamental limitations of the approach. Targeted education and pilot programs can accelerate acceptance and implementation.`,

  `The landscape has transformed dramatically over the past decade. What once seemed theoretical has become practical reality, with real-world applications demonstrating viability. Market adoption follows predictable patterns, though with sector-specific variations reflecting unique constraints and opportunities.

Key challenges remain around standardization, interoperability, and regulatory frameworks. Industry consortia and policy initiatives address these barriers through collaborative problem-solving. Progress is uneven but directionally consistent toward greater maturity and mainstream adoption.

Looking ahead, the next phase will likely focus on optimization and integration rather than fundamental innovation. Incremental improvements will compound to deliver substantial value over time. Organizations positioned for this transition will capture disproportionate benefits.`,

  `This investigation reveals nuanced dynamics that simple models fail to capture. Multiple factors interact in non-linear ways, producing outcomes that vary significantly across contexts. Understanding these contextual dependencies is essential for effective application of insights.

Evidence from diverse settings demonstrates both universal principles and boundary conditions. What works in one environment may require substantial adaptation elsewhere. Successful implementation demands attention to local conditions and iterative refinement based on feedback.

The research identifies leverage points where targeted interventions yield disproportionate impacts. Resource-constrained actors can achieve meaningful progress by focusing efforts strategically. Priority should align with both impact potential and feasibility of implementation.`,

  `Systematic analysis of available data reveals clear trends alongside significant uncertainties. Confidence in directional predictions exceeds confidence in precise timing or magnitude. Decision-makers must therefore adopt adaptive strategies that remain robust across plausible scenarios.

Risk assessment identifies both threats and opportunities emerging from current trajectories. Proactive positioning enables organizations to mitigate downside risks while capitalizing on upside potential. Passive approaches leave organizations vulnerable to disruptive changes.

Stakeholder engagement throughout the process ensures that diverse perspectives inform strategy development. Technical expertise combines with practical wisdom from frontline practitioners. This integration produces recommendations that are both analytically sound and pragmatically feasible.`,

  `The fundamental mechanisms driving observed phenomena operate across multiple scales. Micro-level processes aggregate to produce macro-level patterns, while system-level dynamics constrain individual-level possibilities. Effective intervention requires coordinated action at appropriate scales.

Comparative analysis across cases illuminates general principles while respecting contextual particularity. Some factors prove consistently important, while others exhibit context-specific relevance. Synthesis of findings generates actionable frameworks applicable across diverse settings with appropriate adaptation.

Implementation science provides guidance for translating research insights into practice. Evidence-based approaches outperform intuition, but require sustained commitment to measurement and learning. Organizations that embrace disciplined experimentation accelerate their capability development.`,

  `Contemporary challenges demand integrated solutions that transcend traditional boundaries. Siloed approaches prove inadequate for addressing interconnected problems. Cross-functional collaboration and systems thinking become essential capabilities for navigating complexity.

Technology serves as enabler rather than solution in itself. Human factors, organizational dynamics, and societal contexts shape outcomes as powerfully as technical capabilities. Holistic approaches that address these multiple dimensions achieve superior results.

Change management emerges as critical success factor across diverse applications. Technical readiness proves necessary but insufficient without corresponding organizational readiness. Leadership, culture, and incentive alignment determine whether potential benefits become realized outcomes.`,

  `Historical perspective reveals recurring patterns across seemingly disparate domains. While specific manifestations differ, underlying dynamics show remarkable consistency. Learning from analogous situations in other contexts enriches understanding and informs strategy.

Current developments mark inflection point in long-term trajectories. Trends that emerged gradually now accelerate toward threshold effects. Organizations and societies must adapt more rapidly than historical precedent to avoid disruption.

The window for proactive positioning narrows as momentum builds toward new equilibria. Early movers face higher uncertainty but gain first-mover advantages. Later entrants benefit from proven models but sacrifice competitive position. Timing decisions involve inherent trade-offs.`,

  `Quantitative analysis provides precise insights into specific questions while qualitative research illuminates broader context and meaning. Integration of both approaches yields comprehensive understanding that neither alone can provide. Methodological pluralism strengthens conclusions and identifies blind spots.

Data quality and availability constrain what can be known with confidence. Investments in measurement infrastructure pay dividends through improved decision-making. However, waiting for perfect information risks paralysis; adaptive approaches embrace uncertainty while gathering additional evidence.

Peer review and replication efforts have substantially strengthened the evidence base. Initial findings that withstand rigorous scrutiny warrant greater confidence. Emerging areas with limited validation require more cautious interpretation and continued investigation.`,

  `Economic, social, and environmental dimensions intersect in complex ways that demand integrated assessment. Optimizing one dimension while ignoring others produces suboptimal overall outcomes. Sustainability requires balancing multiple objectives through thoughtful trade-offs.

Distributional impacts merit explicit consideration alongside aggregate effects. Policies and practices that appear beneficial overall may create concentrated harms for particular groups. Equity considerations shape both ethical evaluation and political feasibility of proposed approaches.

Transition pathways from current state to desired future state require careful sequencing. Some changes must precede others due to logical or practical dependencies. Roadmapping exercises identify critical milestones and inform resource allocation across time horizons.`,

  `Innovation cycles accelerate as enabling technologies mature and diffuse broadly. What required decades historically now transpires in years or months. Organizations must compress strategic planning horizons while maintaining coherent long-term direction.

Uncertainty pervades rapidly changing environments, rendering precise prediction impossible. Scenario planning and options thinking provide superior frameworks for strategy development. Maintaining strategic flexibility becomes as important as operational efficiency.

Competitive dynamics shift as barriers to entry fall and new players emerge. Incumbents must innovate as aggressively as challengers to maintain position. Complacency invites disruption from unexpected directions; continuous environmental scanning proves essential.`,

  `The evidence overwhelmingly supports specific core conclusions while leaving important questions unresolved. Consensus on fundamentals coexists with ongoing debate about details and implications. This pattern reflects healthy scientific discourse rather than weakness in knowledge foundation.

Translation from research to practice encounters predictable barriers related to context specificity and implementation capacity. Generic best practices require thoughtful adaptation to local circumstances. Fidelity to core principles matters more than superficial mimicry of specific tactics.

Measurement and evaluation enable continuous improvement through feedback loops. What gets measured gets managed, but poorly chosen metrics can distort behavior. Thoughtful indicator selection balances comprehensiveness with parsimony.`,

  `Global interconnectedness amplifies both opportunities and risks. Developments in distant locations cascade rapidly through networks, affecting stakeholders worldwide. Resilience requires understanding and managing these systemic interdependencies.

Cultural factors shape how universal technologies and practices manifest in particular settings. One-size-fits-all approaches rarely succeed; cultural intelligence complements technical expertise. Success requires respecting diversity while building on common foundations.

The pace of change strains adaptive capacity of institutions designed for more stable environments. Modernization of governance structures and regulatory frameworks lags practical developments. This gap creates tensions requiring ongoing negotiation and adjustment.`,

  `Breakthrough innovations often emerge from unexpected combinations of existing capabilities. Interdisciplinary collaboration proves especially fruitful for generating novel insights and approaches. Organizations that facilitate knowledge exchange across boundaries gain innovation advantages.

Adoption typically follows S-curve patterns: slow initial uptake, rapid growth, eventual saturation. Understanding current position on this curve informs strategy differently for pioneers versus mainstream versus laggards. Different strategies suit different positions.

Network effects and increasing returns create winner-take-most dynamics in certain domains. Early advantages compound over time, making market entry progressively more difficult. In other domains, sustainable differentiation enables multiple successful players.`,

  `Human behavior rarely conforms to simplified rational actor models. Psychological biases, social influences, and contextual factors powerfully shape decisions and actions. Effective interventions account for these realities rather than assuming idealized behavior.

Communication strategies must address not only information deficits but also motivated reasoning and identity-protective cognition. Facts alone rarely change minds on charged topics. Trusted messengers, appropriate framing, and respect for values improve persuasive efficacy.

Behavioral insights increasingly inform policy design and implementation. Nudges and choice architecture complement traditional regulatory and market approaches. When thoughtfully applied, these tools can improve outcomes while preserving autonomy.`,

  `Long-term thinking reveals different priorities than short-term optimization. Investments in capability development, relationship building, and institutional strengthening pay dividends over extended horizons. Myopic focus on immediate returns sacrifices enduring value creation.

Resilience and adaptability often conflict with efficiency in static environments. Building slack and redundancy imposes costs but enables flexibility and recovery from disruptions. The optimal balance depends on volatility and uncertainty levels in the operating environment.

Legacy systems and path dependencies constrain available options, making wholesale transformation infeasible. Incremental evolution within existing constraints often proves more viable than radical redesign. However, crisis moments sometimes enable otherwise impossible discontinuities.`,

  `Collaboration across organizational and sectoral boundaries generates value that individual actors cannot capture alone. Yet coordination costs and incentive misalignments impede collective action. Institutional innovations that align interests and reduce transaction costs unlock cooperative potential.

Public-private partnerships leverage complementary capabilities when well designed. Government brings regulatory authority, long-term perspective, and public interest orientation. Private sector contributes innovation capacity, operational efficiency, and financial resources. Success requires clear governance and accountability.`,

  `Technological determinism oversimplifies complex sociotechnical systems. Technologies provide affordances and constraints, but human choices and social processes shape ultimate outcomes. Agency remains distributed across multiple actors rather than predetermined by technical characteristics.

The digital divide encompasses not only access but also capability to use technologies effectively. Educational interventions and user-centered design can reduce barriers. However, fundamental inequalities in resources and power persist absent broader structural changes.`,

  `Evidence-based practice has gained prominence across professional domains. Systematic integration of research findings with professional expertise and contextual knowledge improves outcomes. However, mechanistic application without judgment can prove counterproductive.

Knowledge translation requires active effort to bridge research-practice gaps. Academic publications rarely suffice; targeted communication and relationship-building prove essential. Collaborative partnerships between researchers and practitioners generate mutually beneficial insights.`,

  `Risk communication presents challenges especially for low-probability, high-consequence events. Cognitive biases lead to both excessive alarm and unwarranted complacency. Effective communication provides actionable information while acknowledging uncertainty.

Preparedness for emerging risks requires investment before threats materialize. Political and organizational dynamics often prevent adequate preparation absent visible crisis. Learning from near-misses and other sectors' experiences can motivate proactive measures.`,

  `Ethical frameworks provide essential guidance for navigating value-laden choices. Multiple ethical perspectives often yield conflicting prescriptions, requiring deliberative processes to resolve. Procedural legitimacy through stakeholder engagement strengthens acceptance of difficult decisions.

Long-term consequences deserve weight alongside immediate impacts. However, excessive discounting of future effects privileges present over future generations. Sustainability requires balancing temporal considerations appropriately.

Fairness encompasses both procedural and distributive dimensions. Just processes can produce unjust outcomes, and vice versa. Comprehensive ethical assessment considers both means and ends.`,
];

export const briefAbstracts = [
  'This research brief examines cutting-edge developments with implications for industry and society. Key findings highlight transformative potential while acknowledging implementation challenges.',
  'A comprehensive analysis of current trends and future projections in this critical domain. Evidence-based insights guide strategic decision-making for stakeholders.',
  'Exploring the intersection of technology, society, and human needs through rigorous research and analysis. Practical recommendations emerge from theoretical foundations.',
  'This brief synthesizes complex information into actionable insights for leaders and practitioners. Multi-disciplinary perspectives enrich understanding of nuanced challenges.',
  'Examining paradigm shifts and their cascading effects across interconnected systems. Strategic implications guide adaptation and innovation strategies.',
  'An evidence-based investigation of emerging patterns and their potential impacts. This analysis integrates quantitative data with qualitative insights to provide comprehensive perspective.',
  'This brief provides a systematic review of recent developments and their practical applications. Stakeholders across sectors will find relevant insights for strategic planning.',
  'Through rigorous methodology and diverse data sources, this research illuminates critical factors shaping future outcomes. Actionable recommendations are grounded in empirical evidence.',
  'A multi-faceted examination of contemporary challenges and opportunities. This analysis balances theoretical frameworks with real-world case studies to generate meaningful insights.',
  'This brief distills complex research into accessible findings with direct relevance to policy and practice. Evidence synthesis reveals both consensus and areas requiring further investigation.',
  'Investigating the dynamics of change and stability in evolving systems. This research provides framework for understanding current state and anticipating future trajectories.',
  'A focused analysis of critical variables and their interactions. Findings illuminate leverage points for intervention and areas of significant uncertainty requiring attention.',
  'This comprehensive review synthesizes findings across multiple disciplines to address fundamental questions. Implications span scientific, economic, and social domains.',
  'Examining the evidence base supporting current approaches while identifying knowledge gaps. This brief guides prioritization of research and resource allocation.',
  'An integrated assessment of risks and opportunities in rapidly changing landscape. Strategic insights help stakeholders navigate complexity and make informed decisions.',
  'This research explores the mechanisms driving observed phenomena and their broader implications. Findings contribute to theoretical understanding while offering practical guidance.',
  'A critical evaluation of competing perspectives and empirical evidence. This analysis identifies areas of agreement, ongoing debates, and directions for future inquiry.',
  'Investigating the interface between innovation and implementation. This brief examines factors enabling successful translation of research into practice.',
  'Through systematic data analysis and expert consultation, this research provides authoritative perspective on key issues. Recommendations are tailored to diverse stakeholder needs.',
  'This brief examines historical patterns, current dynamics, and future scenarios. Insights support adaptive strategy development in uncertain environment.',
  'A rigorous investigation of fundamental questions with far-reaching implications. This research combines methodological innovation with substantive contribution to field.',
  'Analyzing the convergence of multiple trends and their combined effects. This brief illuminates emergent properties not evident from isolated examination.',
  'This research provides state-of-the-art review of knowledge and capabilities. Gaps and opportunities identified guide future research and development priorities.',
  'An interdisciplinary synthesis revealing connections across traditionally separated domains. Insights emerge from integration of diverse perspectives and methodologies.',
  'This brief examines the evidence supporting different approaches and their comparative effectiveness. Findings inform selection and optimization of interventions.',
];

export const briefThinking = [
  'The analytical process began with identifying key variables and their relationships. Pattern recognition revealed unexpected correlations requiring deeper investigation. Iterative refinement of hypotheses led to more robust conclusions.',
  'Initial assumptions were challenged through systematic examination of evidence. Alternative explanations were considered and tested against available data. The synthesis process integrated diverse perspectives to form coherent insights.',
  'Methodological considerations shaped the research approach and interpretation of findings. Potential biases were acknowledged and mitigated through triangulation. The analytical framework evolved to accommodate emerging insights.',
  'Complex systems thinking guided the exploration of interconnected factors. Feedback loops and emergent properties required non-linear analytical approaches. The investigation revealed multiple layers of causality and influence.',
  'Critical evaluation of sources ensured reliability and validity of conclusions. Contradictory evidence prompted deeper investigation and nuanced interpretation. The reasoning process balanced empirical data with theoretical frameworks.',
  'The investigation commenced by defining scope and establishing clear research questions. Data collection strategies prioritized both breadth and depth of information. Analytical rigor was maintained while remaining open to unexpected findings.',
  'Comparative analysis across cases revealed consistent patterns and contextual variations. This dialectical approach helped distinguish universal principles from situation-specific factors. Synthesis emerged through iterative dialogue between theory and evidence.',
  'Uncertainty quantification was integral to the analytical process. Confidence intervals and sensitivity analyses illuminated robust findings versus tentative conclusions. This probabilistic thinking prevented overgeneralization from limited data.',
  'The research design incorporated multiple validation checkpoints. Peer review and expert consultation identified blind spots and strengthened arguments. Constructive criticism refined both methodology and interpretation.',
  'Temporal dynamics required longitudinal perspective to discern trends from noise. Historical context illuminated present conditions while avoiding anachronistic interpretations. Future projections acknowledged inherent uncertainties and alternative scenarios.',
  'Interdisciplinary integration enriched analysis beyond single-domain limitations. Conceptual frameworks from diverse fields provided complementary lenses. Synthesis across disciplines revealed insights inaccessible to siloed approaches.',
  'The analytical journey involved continuous refinement of mental models. Disconfirming evidence was actively sought to test hypothesis robustness. This self-critical approach strengthened confidence in final conclusions.',
  'Stakeholder perspectives were systematically incorporated to ensure practical relevance. Academic rigor was balanced with accessibility and actionability. The analysis bridges theory-practice divide through grounded recommendations.',
  'Causal inference required careful attention to confounding variables and selection effects. Multiple analytical techniques triangulated findings and tested robustness. The investigation distinguished correlation from causation through rigorous design.',
  'The research leveraged both quantitative precision and qualitative depth. Statistical patterns were enriched by contextual understanding from case studies. Mixed methods approach provided comprehensive yet nuanced insights.',
  'Anomalies and outliers received focused attention rather than dismissal. These edge cases often revealed important mechanisms or boundary conditions. Exceptions tested and ultimately refined general principles.',
  'The analytical framework adapted as understanding deepened through investigation. Initial structures proved insufficient for emergent complexity. Methodological flexibility enabled progressive elaboration of insights.',
  'Hypothesis generation preceded systematic testing in iterative cycles. Abductive reasoning suggested plausible explanations for observed phenomena. Deductive and inductive methods then evaluated and refined these conjectures.',
  'Meta-analytical perspective examined not just findings but the research process itself. Epistemological reflection ensured appropriate confidence in different types of claims. Limitations were acknowledged transparently to guide interpretation.',
  'The investigation balanced parsimony with comprehensiveness. Simple explanations were preferred when adequate, but complexity was embraced when necessary. Occam\'s razor was applied judiciously rather than dogmatically.',
  'Scenario planning explored alternative futures under different assumptions. This prospective analysis illuminated key uncertainties and decision points. Strategic insights emerged from systematic examination of possibilities.',
  'The research process involved continuous reality-checking against emerging data. Confirmation bias was actively countered through devil\'s advocate approaches. Intellectual humility prevented premature closure on complex questions.',
  'Network analysis revealed indirect connections and systemic interdependencies. Node-level understanding was complemented by examination of relationship structures. Emergent properties became visible through this relational lens.',
  'The investigation employed both exploratory and confirmatory methods. Discovery phase generated hypotheses later subjected to rigorous testing. This two-stage approach balanced creativity with empirical discipline.',
  'Cross-cultural and cross-contextual comparisons illuminated universal versus particular factors. Diversity in evidence base strengthened generalizability of conclusions. Cultural sensitivity prevented ethnocentric biases in interpretation.',
];

export const highlightedTexts = [
  'recent studies demonstrate significant improvements',
  'data analysis reveals unprecedented trends',
  'expert consensus indicates fundamental shifts',
  'empirical evidence supports this hypothesis',
  'longitudinal research confirms sustained impact',
  'meta-analysis across 47 studies showed consistent effects',
  'randomized controlled trials provide robust evidence',
  'systematic review indicates strong correlation',
  'population-level data demonstrates clear patterns',
  'experimental results exceed theoretical predictions',
  'observational studies suggest causal mechanisms',
  'cross-sectional analysis reveals striking disparities',
  'prospective cohort research validates the model',
  'regression analysis identifies key contributing factors',
  'qualitative findings provide nuanced understanding',
  'comparative studies highlight context-dependent outcomes',
  'historical data traces evolution over decades',
  'statistical significance was maintained across all subgroups',
  'peer-reviewed research overwhelmingly supports',
  'independent replication confirmed original findings',
  'multivariate analysis controls for confounding variables',
  'evidence synthesis reveals knowledge gaps',
  'methodological rigor strengthens causal inference',
  'emerging research challenges prevailing assumptions',
  'breakthrough discoveries reshape the landscape',
];

export const referenceContexts = [
  'This finding aligns with broader research trends in the field',
  'Multiple independent studies corroborate these observations',
  'The methodology follows established best practices',
  'These results challenge conventional understanding',
  'Further investigation is warranted to confirm preliminary findings',
  'The authors employ rigorous statistical controls to ensure validity',
  'This seminal work has influenced subsequent research directions',
  'Limitations include potential selection bias in the sample',
  'The study design allows for strong causal inferences',
  'Findings have been replicated across diverse populations',
  'This research fills a critical gap in the literature',
  'The theoretical framework provides coherent explanation',
  'Practical implications extend beyond the immediate context',
  'Novel methodology enables investigation of previously inaccessible questions',
  'The data source is considered gold standard in the field',
  'Results should be interpreted with appropriate caution',
  'This work synthesizes fragmented knowledge into unified perspective',
  'The research team brings interdisciplinary expertise',
  'Temporal aspects require longitudinal follow-up studies',
  'The evidence base has strengthened considerably in recent years',
  'These observations inform policy recommendations',
  'The analytical approach represents significant methodological advance',
  'Cross-validation procedures support model robustness',
  'This contribution advances both theory and practice',
  'Emerging consensus reflects accumulating evidence',
];

export const changeLogs = [
  'Updated analysis with latest research findings and statistical data',
  'Revised conclusions based on peer review feedback',
  'Expanded methodology section and added new case studies',
  '  citations and corrected minor factual errors',
  'Enhanced clarity and accessibility of technical content',
];

export const reviewContents: Record<number, string[]> = {
  1: [
    'This analysis lacks depth and fails to address critical aspects of the topic.',
    'Significant factual errors undermine the credibility of this brief.',
    'The conclusions are not supported by the evidence presented.',
    'Poor organization makes it difficult to follow the argument.',
    'Missing important context and recent developments in the field.',
  ],
  2: [
    'While there are some good points, the analysis is incomplete.',
    'The brief would benefit from more rigorous fact-checking.',
    'Some sections are well-researched but others lack substance.',
    'The writing is unclear in places, affecting comprehension.',
    'Needs more balanced perspective and additional sources.',
  ],
  3: [
    'Solid overview but missing some nuanced perspectives.',
    'Good foundation but could use more depth in certain areas.',
    'Adequate coverage of the topic with room for improvement.',
    'Generally accurate but some claims need better support.',
    'Decent analysis that covers the basics effectively.',
  ],
  4: [
    'Well-researched and thoughtfully presented analysis.',
    'Strong arguments supported by credible evidence.',
    'Clear writing makes complex topics accessible.',
    'Good balance of depth and breadth in coverage.',
    'Minor improvements could make this excellent.',
  ],
  5: [
    'Exceptional analysis that sets a new standard for the topic.',
    'Brilliantly researched with impeccable attention to detail.',
    'Outstanding synthesis of complex information.',
    'Masterful presentation that engages and informs.',
    'This is exactly the kind of high-quality content we need.',
  ],
};

export const aiReviewContents: Record<number, string[]> = {
  1: [
    'Analysis reveals critical methodological flaws and unsupported conclusions. Factual accuracy: 23%. Recommendation: Major revision required.',
    'Systematic evaluation identifies multiple errors in reasoning and evidence interpretation. Overall quality score: 1.2/5.0.',
  ],
  2: [
    'Partial accuracy detected with notable gaps in coverage. Factual accuracy: 61%. Some valid points overshadowed by weak argumentation.',
    'Assessment indicates incomplete analysis with potential for improvement. Quality metrics suggest below-average performance.',
  ],
  3: [
    'Balanced evaluation shows adequate coverage with standard accuracy. Factual accuracy: 78%. Meets basic requirements for informational content.',
    'Competent analysis with conventional insights. Statistical validation confirms moderate reliability of conclusions.',
  ],
  4: [
    'Strong analytical framework with minor optimization opportunities. Factual accuracy: 92%. Evidence quality exceeds typical standards.',
    'Robust methodology and well-supported conclusions. Cross-reference validation confirms high reliability of key findings.',
  ],
  5: [
    'Exemplary analysis demonstrating mastery of subject matter. Factual accuracy: 98%. Innovative insights with strong empirical support.',
    'Superior quality metrics across all evaluation criteria. Methodology and conclusions withstand rigorous scrutiny.',
  ],
};