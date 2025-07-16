export interface SeedConfig {
  // Delete options
  deleteAll?: boolean;
  deleteTables?: string[];
  force?: boolean; // Add force flag

  // Table-specific configurations
  users?: {
    enabled: boolean;
    count: number;
    adminRatio?: number;
    emailVerifiedRatio?: number;
    notificationSettings?: {
      emailNotificationsRatio?: number;
      briefInterestUpdatesRatio?: number;
      promotionalNotificationsRatio?: number;
    }; 
  };

  accounts?: {
    enabled: boolean;
    providersDistribution?: Record<string, number>;
  };

  researchAIModels?: {
    enabled: boolean;
    models?: Array<{ name: string; provider: string; version: string }>;
  };

  reviewAIModels?: {
    enabled: boolean;
    models?: Array<{ name: string; provider: string; version: string }>;
  };

  categories?: {
    enabled: boolean;
    customCategories?: string[];
    count?: number;
  };

  sources?: {
    enabled: boolean;
    count: number;
    urlPatterns?: string[];
  };

  briefs?: {
    enabled: boolean;
    count: number;
    publishedRatio?: number;
    draftRatio?: number;
    withAbstractRatio?: number;
    withThinkingRatio?: number;
    viewCountRange?: [number, number];
    readTimeRange?: [number, number];
    accuracyRange?: [number, number];
    categoriesPerBrief?: [number, number];
    sourcesPerBrief?: [number, number];
    referencesPerBrief?: [number, number];
    versionsEnabled?: boolean;
    maxVersionsPerBrief?: number;
    qualityDistribution?: Record<'high' | 'medium' | 'low', number>;
  };

  reviews?: {
    enabled: boolean;
    reviewsPerBrief?: [number, number];
    ratingDistribution?: Record<number, number>;
  };

  aiReviews?: {
    enabled: boolean;
    aiReviewsPerBrief?: [number, number];
    ratingDistribution?: Record<number, number>;
  };

  upvotes?: {
    enabled: boolean;
    briefUpvoteRatio?: number;
    reviewUpvoteRatio?: number;
    maxUpvotesPerUser?: number;
  };

  savedBriefs?: {
    enabled: boolean;
    saveRatio?: number;
    maxSavesPerUser?: number;
  };

  briefViews?: {
    enabled: boolean;
    viewRatio?: number;
    multipleViewsPerUser?: boolean;
  };

  tokens?: {
    enabled: boolean;
    initialBalanceRange?: [number, number];
    transactionCountRange?: [number, number];
    purchaseRatio?: number;
    economyType?: 'balanced' | 'inflationary' | 'deflationary';
    whaleRatio?: number;
  };

  exports?: {
    enabled: boolean;
    exportsPerUser?: [number, number];
    formatDistribution?: Record<string, number>;
  };

  // Relationships and data skewing
  dataSkew?: {
    powerUsers?: boolean;
    viralBriefs?: boolean;
    controversialContent?: boolean;
    timeDistribution?: 'uniform' | 'recent' | 'exponential';
    startDate?: Date;
    endDate?: Date;
  };

  // Relational patterns
  relationalPatterns?: {
    userBriefCorrelation?: 'normal' | 'powerLaw' | 'uniform';
    reviewAuthorship?: 'diverse' | 'concentrated' | 'reciprocal';
    categoryDistribution?: 'balanced' | 'skewed' | 'hierarchical';
    temporalClustering?: 'none' | 'weekly' | 'monthly' | 'events';
    engagementPatterns?: 'organic' | 'viral' | 'steady' | 'declining';
    networkEffects?: {
      followPattern?: 'random' | 'preferential' | 'community';
      interactionDensity?: number;
      clusteringCoefficient?: number;
    };
  };

  safetyCheck?: {
    skipTokenValidation?: boolean;
    strictMode?: boolean;
    allowedDomains?: string[];
  };

  // Progress callback
  onProgress?: (message: string, percentage?: number) => void;
}

export interface DatabaseSafetyCheck {
  isSafe: boolean;
  nonSeedData: {
    type: string;
    count: number;
    examples: string[];
  }[];
  totalNonSeedRecords: number;
  warnings: string[];
  seedingMetadata?: {
    lastSeedDate?: Date;
    seedVersion?: string;
    totalSeedRecords?: number;
  };
}

// Default configuration for initial seeding
export const DEFAULT_CONFIG: SeedConfig = {
  deleteAll: true,
  users: {
    enabled: true,
    count: 100,
    adminRatio: 0.05,
    emailVerifiedRatio: 0.8,
    notificationSettings: {
      emailNotificationsRatio: 0.7,
      briefInterestUpdatesRatio: 0.6,
      promotionalNotificationsRatio: 0.5,
    },
  },
  accounts: {
    enabled: true,
    providersDistribution: { google: 0.6, github: 0.3, credentials: 0.1 },
  },
  researchAIModels: {
    enabled: true,
    models: [
      { name: 'GPT-4', provider: 'OpenAI', version: '1.0' },
      { name: 'GPT-4-Turbo', provider: 'OpenAI', version: '2.0' },
      { name: 'Claude-3', provider: 'Anthropic', version: '1.0' },
      { name: 'Claude-3.5', provider: 'Anthropic', version: '1.5' },
      { name: 'Gemini-Pro', provider: 'Google', version: '1.0' },
    ],
  },
  reviewAIModels: {
    enabled: true,
    models: [
      { name: 'GPT-4', provider: 'OpenAI', version: '1.0' },
      { name: 'Claude-3', provider: 'Anthropic', version: '1.0' },
    ],
  },
  categories: {
    enabled: true,
    count: 20,
  },
  sources: {
    enabled: true,
    count: 200,
  },
  briefs: {
    enabled: true,
    count: 500,
    publishedRatio: 0.9,
    draftRatio: 0.05,
    withAbstractRatio: 0.7,
    withThinkingRatio: 0.3,
    viewCountRange: [0, 10000],
    readTimeRange: [3, 30],
    accuracyRange: [2.5, 5.0],
    categoriesPerBrief: [1, 4],
    sourcesPerBrief: [2, 8],
    referencesPerBrief: [1, 5],
    versionsEnabled: true,
    maxVersionsPerBrief: 3,
    qualityDistribution: { high: 0.2, medium: 0.6, low: 0.2 },
  },
  reviews: {
    enabled: true,
    reviewsPerBrief: [0, 15],
    ratingDistribution: { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.3 },
  },
  aiReviews: {
    enabled: true,
    aiReviewsPerBrief: [0, 3],
    ratingDistribution: { 1: 0.02, 2: 0.08, 3: 0.25, 4: 0.40, 5: 0.25 },
  },
  upvotes: {
    enabled: true,
    briefUpvoteRatio: 0.6,
    reviewUpvoteRatio: 0.4,
    maxUpvotesPerUser: 50,
  },
  savedBriefs: {
    enabled: true,
    saveRatio: 0.3,
    maxSavesPerUser: 30,
  },
  briefViews: {
    enabled: true,
    viewRatio: 0.8,
    multipleViewsPerUser: false,
  },
  tokens: {
    enabled: true,
    initialBalanceRange: [0, 1000],
    transactionCountRange: [0, 50],
    purchaseRatio: 0.2,
    economyType: 'balanced',
    whaleRatio: 0.05,
  },
  exports: {
    enabled: true,
    exportsPerUser: [0, 10],
    formatDistribution: { pdf: 0.4, markdown: 0.2, html: 0.15, json: 0.1, csv: 0.05, docx: 0.05, txt: 0.05 },
  },
  dataSkew: {
    powerUsers: true,
    viralBriefs: true,
    controversialContent: true,
    timeDistribution: 'recent',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  relationalPatterns: {
    userBriefCorrelation: 'normal',
    reviewAuthorship: 'diverse',
    categoryDistribution: 'balanced',
    temporalClustering: 'none',
    engagementPatterns: 'organic',
    networkEffects: {
      followPattern: 'random',
      interactionDensity: 0.3,
      clusteringCoefficient: 0.5,
    },
  },
};