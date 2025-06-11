// Local mode utilities and configuration
export const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';

// Mock user for local development
export const LOCAL_USER = {
  id: 'local-user-1',
  name: 'Demo User',
  email: 'demo@localhost',
  image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNFNUU3RUIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+',
  emailVerified: new Date(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// Additional mock users for variety
export const MOCK_USERS = [
  LOCAL_USER,
  {
    id: 'local-user-2',
    name: 'Dr. Sarah Chen',
    email: 'sarah@localhost',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGM0Y0RjYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjNkI3MjgwIi8+PC9zdmc+',
    emailVerified: new Date(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'local-user-3',
    name: 'Prof. Michael Rodriguez',
    email: 'michael@localhost',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNEQ0ZERjQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzM3NEY2OCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjMzc0RjY4Ii8+PC9zdmc+',
    emailVerified: new Date(),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

// Mock session for local mode
export const LOCAL_SESSION = {
  user: LOCAL_USER,
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
};

// Helper functions
export function getLocalUser() {
  return LOCAL_MODE ? LOCAL_USER : null;
}

export function getLocalSession() {
  return LOCAL_MODE ? LOCAL_SESSION : null;
}

export function isLocalMode() {
  return LOCAL_MODE;
}

// Mock data generators
export function generateMockBriefs() {
  return [
    {
      id: 'brief-1',
      title: 'Advances in Quantum Computing: A Comprehensive Review',
      abstract: 'This research brief explores the latest developments in quantum computing, including recent breakthroughs in quantum supremacy and practical applications.',
      response: 'Quantum computing has made significant strides in recent years, with major tech companies and research institutions achieving remarkable milestones...',
      thinking: 'To provide a comprehensive overview, I analyzed recent papers from Nature, Science, and arXiv focusing on quantum computing developments...',
      slug: 'advances-quantum-computing-review',
      published: true,
      userId: 'local-user-1',
      modelId: 'model-1',
      viewCount: 1247,
      readTime: 8,
      accuracy: 4.6,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
    },
    {
      id: 'brief-2',
      title: 'Machine Learning in Healthcare: Current Applications and Future Prospects',
      abstract: 'An analysis of how machine learning is transforming healthcare, from diagnostic imaging to drug discovery.',
      response: 'Machine learning applications in healthcare have expanded rapidly, showing promising results in medical imaging, predictive analytics...',
      thinking: 'I focused on peer-reviewed studies and clinical trials to ensure accuracy in this sensitive domain...',
      slug: 'ml-healthcare-applications',
      published: true,
      userId: 'local-user-2',
      modelId: 'model-2',
      viewCount: 892,
      readTime: 12,
      accuracy: 4.8,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
    },
    {
      id: 'brief-3',
      title: 'Climate Change Mitigation Through Renewable Energy Technologies',
      abstract: 'Examining the role of renewable energy technologies in addressing climate change challenges.',
      response: 'Renewable energy technologies have become increasingly cost-effective and efficient, offering viable solutions for climate change mitigation...',
      thinking: 'I analyzed IPCC reports, energy statistics, and recent technological developments to provide a balanced perspective...',
      slug: 'climate-renewable-energy',
      published: true,
      userId: 'local-user-3',
      modelId: 'model-1',
      viewCount: 634,
      readTime: 10,
      accuracy: 4.4,
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-03-05'),
    },
  ];
}

export function generateMockModels() {
  return [
    {
      id: 'model-1',
      name: 'GPT-4',
      provider: 'openai',
      version: '4.0',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'model-2',
      name: 'Claude',
      provider: 'anthropic',
      version: '3.5',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];
}

export function generateMockCategories() {
  return [
    { id: 'cat-1', name: 'Computer Science', description: 'Computing and technology research' },
    { id: 'cat-2', name: 'Healthcare', description: 'Medical and health-related research' },
    { id: 'cat-3', name: 'Climate Science', description: 'Environmental and climate research' },
    { id: 'cat-4', name: 'Physics', description: 'Physics and quantum research' },
    { id: 'cat-5', name: 'Biology', description: 'Biological and life sciences research' },
  ];
}
