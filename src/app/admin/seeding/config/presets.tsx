import React from 'react';
import { Zap, Settings, Database, TrendingUp } from 'lucide-react';

export const PRESETS = [
  {
    name: 'Quick Test',
    description: 'Minimal data for quick testing',
    icon: <Zap className="w-4 h-4" />,
    config: {
      deleteAll: true,
      users: { enabled: true, count: 10 },
      briefs: { enabled: true, count: 20 },
      categories: { enabled: true, count: 5 },
      sources: { enabled: true, count: 30 },
      demoUser: { enabled: true },
    }
  },
  {
    name: 'Development',
    description: 'Balanced dataset for development',
    icon: <Settings className="w-4 h-4" />,
    config: {
      deleteAll: true,
      users: { enabled: true, count: 50, adminRatio: 0.1 },
      briefs: { enabled: true, count: 200, publishedRatio: 0.8 },
      categories: { enabled: true, count: 15 },
      sources: { enabled: true, count: 150 },
      reviews: { enabled: true, reviewsPerBrief: [0, 10] },
      upvotes: { enabled: true, briefUpvoteRatio: 0.6 },
      demoUser: { enabled: true },
      userRecommendations: { enabled: true },
      emailSystem: { enabled: true },
      sessions: { enabled: true },
    }
  },
  {
    name: 'Production-like',
    description: 'Large realistic dataset',
    icon: <Database className="w-4 h-4" />,
    config: {
      deleteAll: true,
      users: { enabled: true, count: 500, adminRatio: 0.05 },
      briefs: { enabled: true, count: 2000, publishedRatio: 0.9 },
      categories: { enabled: true, count: 25 },
      sources: { enabled: true, count: 500 },
      reviews: { enabled: true, reviewsPerBrief: [0, 20] },
      aiReviews: { enabled: true, aiReviewsPerBrief: [0, 3] },
      upvotes: { enabled: true },
      savedBriefs: { enabled: true },
      briefViews: { enabled: true },
      tokens: { enabled: true },
      exports: { enabled: true },
      demoUser: { enabled: true },
      userRecommendations: { enabled: true },
      emailSystem: { enabled: true },
      sessions: { enabled: true },
      reviewHelpfulness: { enabled: true },
      exportUsage: { enabled: true },
      briefQualityTiers: { enabled: true },
      dataSkew: {
        powerUsers: true,
        viralBriefs: true,
        controversialContent: true,
        timeDistribution: 'recent'
      }
    }
  },
  {
    name: 'Stress Test',
    description: 'Maximum data for performance testing',
    icon: <TrendingUp className="w-4 h-4" />,
    config: {
      deleteAll: true,
      users: { enabled: true, count: 5000 },
      briefs: { enabled: true, count: 10000 },
      categories: { enabled: true, count: 50 },
      sources: { enabled: true, count: 2000 },
      reviews: { enabled: true, reviewsPerBrief: [0, 50] },
      demoUser: { enabled: true },
      dataSkew: {
        powerUsers: true,
        viralBriefs: true,
        timeDistribution: 'exponential'
      }
    }
  }
];