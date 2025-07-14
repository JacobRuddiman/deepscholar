import { SeedConfig } from '@/server/actions/seed';

export function getDefaultConfig(): SeedConfig {
  return {
    deleteAll: true,
    
    demoUser: {
      enabled: false,
      email: 'demo@deepscholar.local',
      name: 'Demo User',
      activityMultiplier: 3.0,
      adminPrivileges: true,
    },
    
    users: {
      enabled: true,
      count: 100,
      adminRatio: 0.05,
      emailVerifiedRatio: 0.8,
      notificationSettings: {
        emailNotificationsRatio: 0.7,
        briefInterestUpdatesRatio: 0.6,
        promotionalNotificationsRatio: 0.5,
      }
    },
    
    accounts: {
      enabled: true,
      providersDistribution: { google: 0.6, github: 0.3, credentials: 0.1 }
    },
    
    researchAIModels: {
      enabled: true,
      models: [
        { name: 'GPT-4', provider: 'OpenAI', version: '1.0' },
        { name: 'Claude-3', provider: 'Anthropic', version: '1.0' },
      ]
    },
    
    reviewAIModels: {
      enabled: true,
      models: [
        { name: 'GPT-4', provider: 'OpenAI', version: '1.0' },
        { name: 'Claude-3', provider: 'Anthropic', version: '1.0' },
      ]
    },
    
    categories: {
      enabled: true,
      count: 20
    },
    
    sources: {
      enabled: true,
      count: 200
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
      qualityDistribution: { high: 0.2, medium: 0.6, low: 0.2 }
    },
    
    reviews: {
      enabled: true,
      reviewsPerBrief: [0, 15],
      ratingDistribution: { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.3 }
    },
    
    aiReviews: {
      enabled: true,
      aiReviewsPerBrief: [0, 3],
      ratingDistribution: { 1: 0.02, 2: 0.08, 3: 0.25, 4: 0.40, 5: 0.25 }
    },
    
    upvotes: {
      enabled: true,
      briefUpvoteRatio: 0.6,
      reviewUpvoteRatio: 0.4,
      maxUpvotesPerUser: 50
    },
    
    savedBriefs: {
      enabled: true,
      saveRatio: 0.3,
      maxSavesPerUser: 30
    },
    
    briefViews: {
      enabled: true,
      viewRatio: 0.8,
      multipleViewsPerUser: false
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
      formatDistribution: { pdf: 0.4, markdown: 0.2, html: 0.15, json: 0.1, csv: 0.05, docx: 0.05, txt: 0.05 }
    },
    
    dataSkew: {
      powerUsers: false,
      viralBriefs: false,
      controversialContent: false,
      timeDistribution: 'uniform',
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    
    userRecommendations: {
      enabled: true,
      recommendationRatio: 0.7,
      keywordDiversity: 15,
      categoryInteractions: 8,
    },
    
    emailSystem: {
      enabled: true,
      footerCount: 3,
      sentEmailsPerUser: [0, 5],
      scheduledEmailRatio: 0.1,
      emailDeliverySuccess: 0.95,
    },
    
    accountProviders: {
      enabled: true,
      googleRatio: 0.6,
      githubRatio: 0.3,
      credentialsRatio: 0.1,
      multipleAccountsRatio: 0.15,
    },
    
    reviewHelpfulness: {
      enabled: true,
      helpfulMarkRatio: 0.4,
      helpfulMarksPerUser: [0, 20],
    },
    
    exportUsage: {
      enabled: true,
      dailyExportLimit: 10,
      peakUsageDays: 30,
      formatPopularity: {
        pdf: 0.5,
        markdown: 0.2,
        html: 0.15,
        json: 0.1,
        csv: 0.05,
      },
    },
    
    sessions: {
      enabled: true,
      activeSessionRatio: 0.3,
      sessionDuration: [1, 8],
      multipleSessionsRatio: 0.2,
    },
    
    briefSlugs: {
      enabled: true,
      slugPattern: 'mixed',
      duplicateHandling: 'numbered',
    },
    
    tokenTransactionTypes: {
      enabled: true,
      typeDistribution: {
        'Brief creation': 0.3,
        'Review reward': 0.2,
        'Upvote reward': 0.15,
        'Export usage': 0.1,
        'Quality bonus': 0.1,
        'Premium feature': 0.15,
      },
      bonusTransactionRatio: 0.2,
      penaltyTransactionRatio: 0.05,
    },
    
    aiModelVersions: {
      enabled: true,
      researchModelVersions: 3,
      reviewModelVersions: 2,
      modelUpdateFrequency: 'monthly',
    },
    
    briefQualityTiers: {
      enabled: true,
      highQualityRatio: 0.2,
      mediumQualityRatio: 0.6,
      lowQualityRatio: 0.2,
      qualityFactors: ['accuracy', 'citations', 'engagement'],
    },
  };
}