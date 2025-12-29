import { SeedConfig } from '@/server/actions/seed';

export function getDefaultConfig(): SeedConfig {
  return {
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
  };
}