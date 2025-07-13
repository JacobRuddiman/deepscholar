// app/admin/seeding/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Download,
  RefreshCw,
  Zap,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Coins,
  Share2,
  BarChart3,
  Shuffle,
  Target,
  Layers,
  GitBranch,
  Clock,
  Calendar,
  HelpCircle,
  Star,
  Award
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { seed, type SeedConfig } from '@/server/actions/seed';

interface TooltipProps {
  content: string;
}

function Tooltip({ content }: TooltipProps) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <HelpCircle
        className="w-4 h-4 text-gray-400 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute z-10 w-64 p-2 -top-2 left-6 bg-gray-900 text-white text-xs rounded shadow-lg">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3"></div>
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

interface PresetConfig {
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Partial<SeedConfig>;
}

const PRESETS: PresetConfig[] = [
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

export default function DataSynthPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  // Configuration state
  const [config, setConfig] = useState<SeedConfig>({
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
      purchaseRatio: 0.2
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
    
    // New data point: Brief Quality Distribution
    briefQualityTiers: {
      enabled: true,
      highQualityRatio: 0.2,
      mediumQualityRatio: 0.6,
      lowQualityRatio: 0.2,
      qualityFactors: ['accuracy', 'citations', 'engagement'],
    },
  });

  const handlePresetSelect = (preset: PresetConfig) => {
    setActivePreset(preset.name);
    setConfig(prev => ({
      ...prev,
      ...preset.config
    }));
  };

  const generateConsoleCommand = () => {
    let command = 'npm run db:seed';
    
    // Basic flags
    if (!config.deleteAll) command += ' --no-delete';
    
    // Demo user
    if (config.demoUser?.enabled) {
      command += ' --demo-user';
      if (config.demoUser.email !== 'demo@deepscholar.local') {
        command += ` --demo-email ${config.demoUser.email}`;
      }
      if (config.demoUser.activityMultiplier !== 3.0) {
        command += ` --demo-activity ${config.demoUser.activityMultiplier}`;
      }
      if (!config.demoUser.adminPrivileges) {
        command += ' --demo-no-admin';
      }
    }
    
    // Users
    if (config.users?.enabled) {
      if (config.users.count) command += ` --users ${config.users.count}`;
      if (config.users.adminRatio && config.users.adminRatio !== 0.05) {
        command += ` --admin-ratio ${config.users.adminRatio}`;
      }
      if (config.users.emailVerifiedRatio && config.users.emailVerifiedRatio !== 0.8) {
        command += ` --email-verified-ratio ${config.users.emailVerifiedRatio}`;
      }
      
      // Notification settings
      const notif = config.users.notificationSettings;
      if (notif?.emailNotificationsRatio && notif.emailNotificationsRatio !== 0.7) {
        command += ` --email-notifications ${notif.emailNotificationsRatio}`;
      }
      if (notif?.briefInterestUpdatesRatio && notif.briefInterestUpdatesRatio !== 0.6) {
        command += ` --brief-interest-updates ${notif.briefInterestUpdatesRatio}`;
      }
      if (notif?.promotionalNotificationsRatio && notif.promotionalNotificationsRatio !== 0.5) {
        command += ` --promotional-notifications ${notif.promotionalNotificationsRatio}`;
      }
    }
    
    // Briefs
    if (config.briefs?.enabled) {
      if (config.briefs.count) command += ` --briefs ${config.briefs.count}`;
      if (config.briefs.publishedRatio && config.briefs.publishedRatio !== 0.9) {
        command += ` --published-ratio ${config.briefs.publishedRatio}`;
      }
      if (config.briefs.draftRatio && config.briefs.draftRatio !== 0.05) {
        command += ` --draft-ratio ${config.briefs.draftRatio}`;
      }
      if (config.briefs.withAbstractRatio && config.briefs.withAbstractRatio !== 0.7) {
        command += ` --abstract-ratio ${config.briefs.withAbstractRatio}`;
      }
      if (config.briefs.withThinkingRatio && config.briefs.withThinkingRatio !== 0.3) {
        command += ` --thinking-ratio ${config.briefs.withThinkingRatio}`;
      }
      
      // Ranges
      if (config.briefs.viewCountRange) {
        command += ` --view-count-range ${config.briefs.viewCountRange[0]},${config.briefs.viewCountRange[1]}`;
      }
      if (config.briefs.readTimeRange) {
        command += ` --read-time-range ${config.briefs.readTimeRange[0]},${config.briefs.readTimeRange[1]}`;
      }
      if (config.briefs.accuracyRange) {
        command += ` --accuracy-range ${config.briefs.accuracyRange[0]},${config.briefs.accuracyRange[1]}`;
      }
      if (config.briefs.categoriesPerBrief) {
        command += ` --categories-per-brief ${config.briefs.categoriesPerBrief[0]},${config.briefs.categoriesPerBrief[1]}`;
      }
      if (config.briefs.sourcesPerBrief) {
        command += ` --sources-per-brief ${config.briefs.sourcesPerBrief[0]},${config.briefs.sourcesPerBrief[1]}`;
      }
      if (config.briefs.referencesPerBrief) {
        command += ` --references-per-brief ${config.briefs.referencesPerBrief[0]},${config.briefs.referencesPerBrief[1]}`;
      }
      
      // Versions
      if (config.briefs.versionsEnabled) {
        command += ' --versions-enabled';
        if (config.briefs.maxVersionsPerBrief && config.briefs.maxVersionsPerBrief !== 3) {
          command += ` --max-versions ${config.briefs.maxVersionsPerBrief}`;
        }
      }
      
      // Quality distribution
      if (config.briefs.qualityDistribution) {
        const high = config.briefs.qualityDistribution.high || 0.2;
        const medium = config.briefs.qualityDistribution.medium || 0.6;
        const low = config.briefs.qualityDistribution.low || 0.2;
        if (high !== 0.2 || medium !== 0.6 || low !== 0.2) {
          command += ` --quality-dist ${high},${medium},${low}`;
        }
      }
    }
    
    // Sources & Categories
    if (config.sources?.count) command += ` --sources ${config.sources.count}`;
    if (config.categories?.count) command += ` --categories ${config.categories.count}`;
    
    // Reviews
    if (config.reviews?.enabled && config.reviews.reviewsPerBrief) {
      command += ` --reviews-per-brief ${config.reviews.reviewsPerBrief[0]},${config.reviews.reviewsPerBrief[1]}`;
    }
    if (config.aiReviews?.enabled && config.aiReviews.aiReviewsPerBrief) {
      command += ` --ai-reviews-per-brief ${config.aiReviews.aiReviewsPerBrief[0]},${config.aiReviews.aiReviewsPerBrief[1]}`;
    }
    
    // Engagement
    if (config.upvotes?.enabled) {
      if (config.upvotes.briefUpvoteRatio !== 0.6) {
        command += ` --brief-upvote-ratio ${config.upvotes.briefUpvoteRatio}`;
      }
      if (config.upvotes.reviewUpvoteRatio !== 0.4) {
        command += ` --review-upvote-ratio ${config.upvotes.reviewUpvoteRatio}`;
      }
      if (config.upvotes.maxUpvotesPerUser !== 50) {
        command += ` --max-upvotes-per-user ${config.upvotes.maxUpvotesPerUser}`;
      }
    }
    
    if (config.savedBriefs?.enabled) {
      if (config.savedBriefs.saveRatio !== 0.3) {
        command += ` --save-ratio ${config.savedBriefs.saveRatio}`;
      }
      if (config.savedBriefs.maxSavesPerUser !== 30) {
        command += ` --max-saves-per-user ${config.savedBriefs.maxSavesPerUser}`;
      }
    }
    
    if (config.briefViews?.enabled) {
      if (config.briefViews.viewRatio !== 0.8) {
        command += ` --view-ratio ${config.briefViews.viewRatio}`;
      }
      if (config.briefViews.multipleViewsPerUser) {
        command += ' --multiple-views';
      }
    }
    
    // Tokens
    if (config.tokens?.enabled) {
      if (config.tokens.initialBalanceRange) {
        command += ` --initial-balance ${config.tokens.initialBalanceRange[0]},${config.tokens.initialBalanceRange[1]}`;
      }
      if (config.tokens.purchaseRatio !== 0.2) {
        command += ` --purchase-ratio ${config.tokens.purchaseRatio}`;
      }
    }
    
    // User recommendations
    if (config.userRecommendations?.enabled) {
      command += ' --user-recommendations';
      if (config.userRecommendations.recommendationRatio !== 0.7) {
        command += ` --recommendation-ratio ${config.userRecommendations.recommendationRatio}`;
      }
    }
    
    // Email system
    if (config.emailSystem?.enabled) {
      command += ' --email-system';
      if (config.emailSystem.footerCount !== 3) {
        command += ` --email-footers ${config.emailSystem.footerCount}`;
      }
    }
    
    // Sessions
    if (config.sessions?.enabled) {
      command += ' --sessions';
      if (config.sessions.activeSessionRatio !== 0.3) {
        command += ` --active-session-ratio ${config.sessions.activeSessionRatio}`;
      }
    }
    
    // Review helpfulness
    if (config.reviewHelpfulness?.enabled) {
      command += ' --review-helpfulness';
      if (config.reviewHelpfulness.helpfulMarkRatio !== 0.4) {
        command += ` --helpful-ratio ${config.reviewHelpfulness.helpfulMarkRatio}`;
      }
    }
    
    // Brief quality tiers
    if (config.briefQualityTiers?.enabled) {
      command += ' --quality-tiers';
      if (config.briefQualityTiers.highQualityRatio !== 0.2) {
        command += ` --high-quality-ratio ${config.briefQualityTiers.highQualityRatio}`;
      }
    }
    
    // Data skew flags
    if (config.dataSkew?.powerUsers) command += ' --power-users';
    if (config.dataSkew?.viralBriefs) command += ' --viral-briefs';
    if (config.dataSkew?.controversialContent) command += ' --controversial';
    if (config.dataSkew?.timeDistribution && config.dataSkew.timeDistribution !== 'uniform') {
      command += ` --time-dist ${config.dataSkew.timeDistribution}`;
    }
    if (config.dataSkew?.startDate) {
      command += ` --start-date ${config.dataSkew.startDate.toISOString().split('T')[0]}`;
    }
    if (config.dataSkew?.endDate) {
      command += ` --end-date ${config.dataSkew.endDate.toISOString().split('T')[0]}`;
    }
    
    return command;
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResult(null);
    setConsoleOutput(['Starting seed operation...']);

    try {
      const result = await seed(config);
      
      if (result.success) {
        setSeedResult(result);
        setConsoleOutput(prev => [...prev, '✅ Seed completed successfully!']);
      } else {
        setError(result.error || 'Seeding failed');
        setConsoleOutput(prev => [...prev, `❌ Error: ${result.error}`]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setConsoleOutput(prev => [...prev, `❌ Error: ${errorMsg}`]);
    } finally {
      setIsSeeding(false);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generateConsoleCommand());
  };

  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Synthesis</h1>
        <p className="text-gray-600 mt-2">Generate synthetic data for development and testing</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Seeding Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {seedResult?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Seeding Completed Successfully</p>
            <p className="text-green-600 text-sm mt-1">Duration: {seedResult.duration}</p>
            {seedResult.summary && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(seedResult.summary).map(([key, value]) => (
                  <div key={key} className="bg-white rounded px-3 py-2">
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                    <p className="text-sm font-semibold text-gray-900">{value as number}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activePreset === preset.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {preset.icon}
                <span className="font-medium text-gray-900">{preset.name}</span>
              </div>
              <p className="text-xs text-gray-600 text-left">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration */}
      <div className="space-y-4">
        {/* Delete Options */}
        <CollapsibleSection
          title="Delete Options"
          icon={<Trash2 className="w-5 h-5 text-red-500" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="deleteAll"
                checked={config.deleteAll}
                onChange={(e) => setConfig({ ...config, deleteAll: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="deleteAll" className="text-sm font-medium text-gray-700">
                Delete all existing data before seeding
              </label>
              <Tooltip content="When enabled, all existing data will be removed before creating new synthetic data. This ensures a clean database state." />
            </div>
          </div>
        </CollapsibleSection>

        {/* Demo User Configuration */}
        <CollapsibleSection
          title="Demo User"
          icon={<Users className="w-5 h-5 text-purple-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="demoUserEnabled"
                checked={config.demoUser?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  demoUser: { ...config.demoUser!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="demoUserEnabled" className="text-sm font-medium text-gray-700">
                Create Demo User
              </label>
              <Tooltip content="Creates a special demo user account for demonstration purposes with enhanced activity levels." />
            </div>

            {config.demoUser?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Demo User Email
                    </label>
                    <Tooltip content="Email address for the demo user account." />
                  </div>
                  <Input
                    type="email"
                    value={config.demoUser.email}
                    onChange={(e) => setConfig({
                      ...config,
                      demoUser: { ...config.demoUser!, email: e.target.value }
                    })}
                    placeholder="demo@deepscholar.local"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Demo User Name
                    </label>
                    <Tooltip content="Display name for the demo user." />
                  </div>
                  <Input
                    type="text"
                    value={config.demoUser.name}
                    onChange={(e) => setConfig({
                      ...config,
                      demoUser: { ...config.demoUser!, name: e.target.value }
                    })}
                    placeholder="Demo User"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Activity Multiplier
                    </label>
                    <Tooltip content="How much more active the demo user is compared to average users (1.0 = normal, 3.0 = 3x more active)." />
                  </div>
                  <Input
                    type="number"
                    value={config.demoUser.activityMultiplier}
                    onChange={(e) => setConfig({
                      ...config,
                      demoUser: { ...config.demoUser!, activityMultiplier: parseFloat(e.target.value) || 1.0 }
                    })}
                    min="1"
                    max="10"
                    step="0.1"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="demoUserAdmin"
                    checked={config.demoUser.adminPrivileges}
                    onChange={(e) => setConfig({
                      ...config,
                      demoUser: { ...config.demoUser!, adminPrivileges: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="demoUserAdmin" className="text-sm font-medium text-gray-700">
                    Admin Privileges
                  </label>
                  <Tooltip content="Whether the demo user should have admin access." />
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Users Configuration */}
        <CollapsibleSection
          title="Users"
          icon={<Users className="w-5 h-5 text-blue-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="usersEnabled"
                checked={config.users?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  users: { ...config.users!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="usersEnabled" className="text-sm font-medium text-gray-700">
                Generate Users
              </label>
              <Tooltip content="Create synthetic user accounts with profiles, authentication data, and preferences." />
            </div>

            {config.users?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Users
                    </label>
                    <Tooltip content="Total number of user accounts to create. More users allow for more realistic interaction patterns." />
                  </div>
                  <Input
                    type="number"
                    value={config.users.count}
                    onChange={(e) => setConfig({
                      ...config,
                      users: { ...config.users!, count: parseInt(e.target.value) || 0 }
                    })}
                    min="1"
                    max="10000"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Admin Ratio
                    </label>
                    <Tooltip content="Percentage of users who will have admin privileges. Typically 5-10% in most systems." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.users.adminRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        users: { ...config.users!, adminRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.users.adminRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Verified Ratio
                    </label>
                    <Tooltip content="Percentage of users who have verified their email addresses. Higher ratios indicate more engaged users." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.users.emailVerifiedRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        users: { ...config.users!, emailVerifiedRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.users.emailVerifiedRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {showAdvanced && (
                  <>
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Settings</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <label className="text-xs text-gray-600">Email Notifications</label>
                            <Tooltip content="Percentage of users who have email notifications enabled." />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              value={config.users.notificationSettings?.emailNotificationsRatio! * 100}
                              onChange={(e) => setConfig({
                                ...config,
                                users: {
                                  ...config.users!,
                                  notificationSettings: {
                                    ...config.users!.notificationSettings!,
                                    emailNotificationsRatio: parseInt(e.target.value) / 100
                                  }
                                }
                              })}
                              min="0"
                              max="100"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">
                              {Math.round((config.users.notificationSettings?.emailNotificationsRatio || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <label className="text-xs text-gray-600">Brief Interest Updates</label>
                            <Tooltip content="Percentage of users subscribed to brief interest update notifications." />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              value={config.users.notificationSettings?.briefInterestUpdatesRatio! * 100}
                              onChange={(e) => setConfig({
                                ...config,
                                users: {
                                  ...config.users!,
                                  notificationSettings: {
                                    ...config.users!.notificationSettings!,
                                    briefInterestUpdatesRatio: parseInt(e.target.value) / 100
                                  }
                                }
                              })}
                              min="0"
                              max="100"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">
                              {Math.round((config.users.notificationSettings?.briefInterestUpdatesRatio || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <label className="text-xs text-gray-600">Promotional Notifications</label>
                            <Tooltip content="Percentage of users who opted in to promotional emails." />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              value={config.users.notificationSettings?.promotionalNotificationsRatio! * 100}
                              onChange={(e) => setConfig({
                                ...config,
                                users: {
                                  ...config.users!,
                                  notificationSettings: {
                                    ...config.users!.notificationSettings!,
                                    promotionalNotificationsRatio: parseInt(e.target.value) / 100
                                  }
                                }
                              })}
                              min="0"
                              max="100"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">
                              {Math.round((config.users.notificationSettings?.promotionalNotificationsRatio || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Briefs Configuration */}
        <CollapsibleSection
          title="Briefs"
          icon={<FileText className="w-5 h-5 text-green-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="briefsEnabled"
                checked={config.briefs?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  briefs: { ...config.briefs!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="briefsEnabled" className="text-sm font-medium text-gray-700">
                Generate Briefs
              </label>
              <Tooltip content="Create synthetic briefs with realistic content, metadata, and relationships to other data." />
            </div>

            {config.briefs?.enabled && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Number of Briefs
                      </label>
                      <Tooltip content="Total number of briefs to generate. More briefs provide better testing scenarios." />
                    </div>
                    <Input
                      type="number"
                      value={config.briefs.count}
                      onChange={(e) => setConfig({
                        ...config,
                        briefs: { ...config.briefs!, count: parseInt(e.target.value) || 0 }
                      })}
                      min="1"
                      max="50000"
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Published Ratio
                      </label>
                      <Tooltip content="Percentage of briefs that are published (vs draft or unpublished). Higher ratios mean more visible content." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={config.briefs.publishedRatio! * 100}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: { ...config.briefs!, publishedRatio: parseInt(e.target.value) / 100 }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round((config.briefs.publishedRatio || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        View Count Range
                      </label>
                      <Tooltip content="Range of view counts for briefs. Affects popularity distribution." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.briefs.viewCountRange?.[0]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            viewCountRange: [parseInt(e.target.value) || 0, config.briefs!.viewCountRange![1]]
                          }
                        })}
                        placeholder="Min"
                        className="w-24"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="number"
                        value={config.briefs.viewCountRange?.[1]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            viewCountRange: [config.briefs!.viewCountRange![0], parseInt(e.target.value) || 0]
                          }
                        })}
                        placeholder="Max"
                        className="w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Categories per Brief
                      </label>
                      <Tooltip content="Number of categories each brief can be tagged with. More categories mean richer classification." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.briefs.categoriesPerBrief?.[0]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            categoriesPerBrief: [parseInt(e.target.value) || 1, config.briefs!.categoriesPerBrief![1]]
                          }
                        })}
                        placeholder="Min"
                        className="w-24"
                        min="1"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="number"
                        value={config.briefs.categoriesPerBrief?.[1]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            categoriesPerBrief: [config.briefs!.categoriesPerBrief![0], parseInt(e.target.value) || 1]
                          }
                        })}
                        placeholder="Max"
                        className="w-24"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Sources per Brief
                      </label>
                      <Tooltip content="Number of source links each brief references. More sources indicate better research." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.briefs.sourcesPerBrief?.[0]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            sourcesPerBrief: [parseInt(e.target.value) || 0, config.briefs!.sourcesPerBrief![1]]
                          }
                        })}
                        placeholder="Min"
                        className="w-24"
                        min="0"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="number"
                        value={config.briefs.sourcesPerBrief?.[1]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            sourcesPerBrief: [config.briefs!.sourcesPerBrief![0], parseInt(e.target.value) || 0]
                          }
                        })}
                        placeholder="Max"
                        className="w-24"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Read Time Range (minutes)
                      </label>
                      <Tooltip content="Estimated reading time for briefs. Affects content length perception." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={config.briefs.readTimeRange?.[0]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            readTimeRange: [parseInt(e.target.value) || 1, config.briefs!.readTimeRange![1]]
                          }
                        })}
                        placeholder="Min"
                        className="w-24"
                        min="1"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="number"
                        value={config.briefs.readTimeRange?.[1]}
                        onChange={(e) => setConfig({
                          ...config,
                          briefs: {
                            ...config.briefs!,
                            readTimeRange: [config.briefs!.readTimeRange![0], parseInt(e.target.value) || 1]
                          }
                        })}
                        placeholder="Max"
                        className="w-24"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Advanced Brief Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            With Abstract Ratio
                          </label>
                          <Tooltip content="Percentage of briefs that include an abstract/summary section." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            value={config.briefs.withAbstractRatio! * 100}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: { ...config.briefs!, withAbstractRatio: parseInt(e.target.value) / 100 }
                            })}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round((config.briefs.withAbstractRatio || 0) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            With Thinking Process Ratio
                          </label>
                          <Tooltip content="Percentage of briefs that expose the AI's thinking process/reasoning." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            value={config.briefs.withThinkingRatio! * 100}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: { ...config.briefs!, withThinkingRatio: parseInt(e.target.value) / 100 }
                            })}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round((config.briefs.withThinkingRatio || 0) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Accuracy Range
                          </label>
                          <Tooltip content="Range of accuracy scores (1-5) for briefs. Higher scores indicate better quality." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={config.briefs.accuracyRange?.[0]}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: {
                                ...config.briefs!,
                                accuracyRange: [parseFloat(e.target.value) || 1, config.briefs!.accuracyRange![1]]
                              }
                            })}
                            placeholder="Min"
                            className="w-24"
                            min="1"
                            max="5"
                            step="0.1"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            value={config.briefs.accuracyRange?.[1]}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: {
                                ...config.briefs!,
                                accuracyRange: [config.briefs!.accuracyRange![0], parseFloat(e.target.value) || 5]
                              }
                            })}
                            placeholder="Max"
                            className="w-24"
                            min="1"
                            max="5"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            References per Brief
                          </label>
                          <Tooltip content="Number of inline references/citations within each brief's content." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={config.briefs.referencesPerBrief?.[0]}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: {
                                ...config.briefs!,
                                referencesPerBrief: [parseInt(e.target.value) || 0, config.briefs!.referencesPerBrief![1]]
                              }
                            })}
                            placeholder="Min"
                            className="w-24"
                            min="0"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            value={config.briefs.referencesPerBrief?.[1]}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: {
                                ...config.briefs!,
                                referencesPerBrief: [config.briefs!.referencesPerBrief![0], parseInt(e.target.value) || 0]
                              }
                            })}
                            placeholder="Max"
                            className="w-24"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Draft Ratio
                          </label>
                          <Tooltip content="Among unpublished briefs, the percentage that are drafts (vs deleted/hidden)." />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            value={config.briefs.draftRatio! * 100}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: { ...config.briefs!, draftRatio: parseInt(e.target.value) / 100 }
                            })}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round((config.briefs.draftRatio || 0) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="versionsEnabled"
                            checked={config.briefs.versionsEnabled}
                            onChange={(e) => setConfig({
                              ...config,
                              briefs: { ...config.briefs!, versionsEnabled: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="versionsEnabled" className="text-sm font-medium text-gray-700">
                            Enable Brief Versions
                          </label>
                          <Tooltip content="Create multiple versions of some briefs to simulate content updates and revisions." />
                        </div>
                        
                        {config.briefs.versionsEnabled && (
                          <div className="mt-2 ml-7">
                            <div className="flex items-center space-x-2 mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Max Versions per Brief
                              </label>
                              <Tooltip content="Maximum number of versions any single brief can have." />
                            </div>
                            <Input
                              type="number"
                              value={config.briefs.maxVersionsPerBrief}
                              onChange={(e) => setConfig({
                                ...config,
                                briefs: { ...config.briefs!, maxVersionsPerBrief: parseInt(e.target.value) || 1 }
                              })}
                              min="1"
                              max="10"
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Brief Quality Distribution */}
        <CollapsibleSection
          title="Brief Quality Distribution"
          icon={<Award className="w-5 h-5 text-yellow-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="briefQualityTiersEnabled"
                checked={config.briefQualityTiers?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  briefQualityTiers: { ...config.briefQualityTiers!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="briefQualityTiersEnabled" className="text-sm font-medium text-gray-700">
                Enable Quality Tiers
              </label>
              <Tooltip content="Applies realistic quality distribution to briefs based on accuracy, citations, and engagement metrics." />
            </div>

            {config.briefQualityTiers?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      High Quality Ratio
                    </label>
                    <Tooltip content="Percentage of briefs classified as high quality (accuracy > 4.0, high engagement)." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.briefQualityTiers.highQualityRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        briefQualityTiers: { ...config.briefQualityTiers!, highQualityRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.briefQualityTiers.highQualityRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Medium Quality Ratio
                    </label>
                    <Tooltip content="Percentage of briefs classified as medium quality (accuracy 3.0-4.0, moderate engagement)." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.briefQualityTiers.mediumQualityRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        briefQualityTiers: { ...config.briefQualityTiers!, mediumQualityRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.briefQualityTiers.mediumQualityRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Low Quality Ratio
                    </label>
                    <Tooltip content="Percentage of briefs classified as low quality (accuracy < 3.0, low engagement)." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.briefQualityTiers.lowQualityRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        briefQualityTiers: { ...config.briefQualityTiers!, lowQualityRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.briefQualityTiers.lowQualityRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Reviews Configuration */}
        <CollapsibleSection
          title="Reviews & Ratings"
          icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="reviewsEnabled"
                checked={config.reviews?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  reviews: { ...config.reviews!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="reviewsEnabled" className="text-sm font-medium text-gray-700">
                Generate User Reviews
              </label>
              <Tooltip content="Create reviews from users with realistic rating distributions and content." />
            </div>

            {config.reviews?.enabled && (
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Reviews per Brief Range
                    </label>
                    <Tooltip content="Range of how many reviews each brief receives. Some briefs may have many reviews, others none." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={config.reviews.reviewsPerBrief?.[0]}
                      onChange={(e) => setConfig({
                        ...config,
                        reviews: {
                          ...config.reviews!,
                          reviewsPerBrief: [parseInt(e.target.value) || 0, config.reviews!.reviewsPerBrief![1]]
                        }
                      })}
                      placeholder="Min"
                      className="w-24"
                      min="0"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      value={config.reviews.reviewsPerBrief?.[1]}
                      onChange={(e) => setConfig({
                        ...config,
                        reviews: {
                          ...config.reviews!,
                          reviewsPerBrief: [config.reviews!.reviewsPerBrief![0], parseInt(e.target.value) || 0]
                        }
                      })}
                      placeholder="Max"
                      className="w-24"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="aiReviewsEnabled"
                  checked={config.aiReviews?.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    aiReviews: { ...config.aiReviews!, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="aiReviewsEnabled" className="text-sm font-medium text-gray-700">
                  Generate AI Reviews
                </label>
                <Tooltip content="Create AI-generated reviews with typically higher quality ratings than user reviews." />
              </div>

              {config.aiReviews?.enabled && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      AI Reviews per Brief Range
                    </label>
                    <Tooltip content="Range of AI reviews per brief. Usually fewer than user reviews." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={config.aiReviews.aiReviewsPerBrief?.[0]}
                      onChange={(e) => setConfig({
                        ...config,
                        aiReviews: {
                          ...config.aiReviews!,
                          aiReviewsPerBrief: [parseInt(e.target.value) || 0, config.aiReviews!.aiReviewsPerBrief![1]]
                        }
                      })}
                      placeholder="Min"
                      className="w-24"
                      min="0"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      value={config.aiReviews.aiReviewsPerBrief?.[1]}
                      onChange={(e) => setConfig({
                        ...config,
                        aiReviews: {
                          ...config.aiReviews!,
                          aiReviewsPerBrief: [config.aiReviews!.aiReviewsPerBrief![0], parseInt(e.target.value) || 0]
                        }
                      })}
                      placeholder="Max"
                      className="w-24"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* User Recommendations */}
        <CollapsibleSection
          title="User Recommendations"
          icon={<Target className="w-5 h-5 text-pink-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="userRecommendationsEnabled"
                checked={config.userRecommendations?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  userRecommendations: { ...config.userRecommendations!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="userRecommendationsEnabled" className="text-sm font-medium text-gray-700">
                Generate User Recommendations
              </label>
              <Tooltip content="Creates AI-powered recommendation profiles for users based on their activity patterns." />
            </div>

            {config.userRecommendations?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Users with Recommendations
                    </label>
                    <Tooltip content="Percentage of users who have recommendation profiles calculated." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.userRecommendations.recommendationRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        userRecommendations: { ...config.userRecommendations!, recommendationRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.userRecommendations.recommendationRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Keyword Diversity
                    </label>
                    <Tooltip content="Number of different keywords tracked per user for recommendations." />
                  </div>
                  <Input
                    type="number"
                    value={config.userRecommendations.keywordDiversity}
                    onChange={(e) => setConfig({
                      ...config,
                      userRecommendations: { ...config.userRecommendations!, keywordDiversity: parseInt(e.target.value) || 15 }
                    })}
                    min="5"
                    max="50"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Category Interactions
                    </label>
                    <Tooltip content="Number of categories each user has interacted with for recommendation purposes." />
                  </div>
                  <Input
                    type="number"
                    value={config.userRecommendations.categoryInteractions}
                    onChange={(e) => setConfig({
                      ...config,
                      userRecommendations: { ...config.userRecommendations!, categoryInteractions: parseInt(e.target.value) || 8 }
                    })}
                    min="3"
                    max="20"
                  />
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Email System */}
        <CollapsibleSection
          title="Email System"
          icon={<MessageSquare className="w-5 h-5 text-cyan-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="emailSystemEnabled"
                checked={config.emailSystem?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  emailSystem: { ...config.emailSystem!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="emailSystemEnabled" className="text-sm font-medium text-gray-700">
                Generate Email Data
              </label>
              <Tooltip content="Creates email footers, sent emails, and scheduled email campaigns." />
            </div>

            {config.emailSystem?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Footers
                    </label>
                    <Tooltip content="Number of different email footer templates to create." />
                  </div>
                  <Input
                    type="number"
                    value={config.emailSystem.footerCount}
                    onChange={(e) => setConfig({
                      ...config,
                      emailSystem: { ...config.emailSystem!, footerCount: parseInt(e.target.value) || 3 }
                    })}
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Sent Emails per User
                    </label>
                    <Tooltip content="Range of emails sent to each user." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={config.emailSystem.sentEmailsPerUser?.[0]}
                      onChange={(e) => setConfig({
                        ...config,
                        emailSystem: {
                          ...config.emailSystem!,
                          sentEmailsPerUser: [parseInt(e.target.value) || 0, config.emailSystem!.sentEmailsPerUser![1]]
                        }
                      })}
                      placeholder="Min"
                      className="w-24"
                      min="0"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      value={config.emailSystem.sentEmailsPerUser?.[1]}
                      onChange={(e) => setConfig({
                        ...config,
                        emailSystem: {
                          ...config.emailSystem!,
                          sentEmailsPerUser: [config.emailSystem!.sentEmailsPerUser![0], parseInt(e.target.value) || 0]
                        }
                      })}
                      placeholder="Max"
                      className="w-24"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Scheduled Email Ratio
                    </label>
                    <Tooltip content="Percentage of users who have scheduled emails pending." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.emailSystem.scheduledEmailRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        emailSystem: { ...config.emailSystem!, scheduledEmailRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.emailSystem.scheduledEmailRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Success Rate
                    </label>
                    <Tooltip content="Percentage of emails that are successfully delivered." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.emailSystem.emailDeliverySuccess! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        emailSystem: { ...config.emailSystem!, emailDeliverySuccess: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.emailSystem.emailDeliverySuccess || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Sessions */}
        <CollapsibleSection
          title="User Sessions"
          icon={<Clock className="w-5 h-5 text-teal-500" />}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sessionsEnabled"
                checked={config.sessions?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  sessions: { ...config.sessions!, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sessionsEnabled" className="text-sm font-medium text-gray-700">
                Generate User Sessions
              </label>
              <Tooltip content="Creates user login sessions and tracks activity patterns." />
            </div>

            {config.sessions?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Active Session Ratio
                    </label>
                    <Tooltip content="Percentage of users with currently active sessions." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.sessions.activeSessionRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        sessions: { ...config.sessions!, activeSessionRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.sessions.activeSessionRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Session Duration (hours)
                    </label>
                    <Tooltip content="Range of how long user sessions last." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={config.sessions.sessionDuration?.[0]}
                      onChange={(e) => setConfig({
                        ...config,
                        sessions: {
                          ...config.sessions!,
                          sessionDuration: [parseInt(e.target.value) || 1, config.sessions!.sessionDuration![1]]
                        }
                      })}
                      placeholder="Min"
                      className="w-24"
                      min="1"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      value={config.sessions.sessionDuration?.[1]}
                      onChange={(e) => setConfig({
                        ...config,
                        sessions: {
                          ...config.sessions!,
                          sessionDuration: [config.sessions!.sessionDuration![0], parseInt(e.target.value) || 1]
                        }
                      })}
                      placeholder="Max"
                      className="w-24"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Multiple Sessions Ratio
                    </label>
                    <Tooltip content="Percentage of users with multiple active sessions (different devices)." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      value={config.sessions.multipleSessionsRatio! * 100}
                      onChange={(e) => setConfig({
                        ...config,
                        sessions: { ...config.sessions!, multipleSessionsRatio: parseInt(e.target.value) / 100 }
                      })}
                      min="0"
                      max="100"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round((config.sessions.multipleSessionsRatio || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Engagement Configuration */}
        <CollapsibleSection
          title="User Engagement"
          icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="upvotesEnabled"
                    checked={config.upvotes?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      upvotes: { ...config.upvotes!, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="upvotesEnabled" className="text-sm font-medium text-gray-700">
                    Generate Upvotes
                  </label>
                  <Tooltip content="Create upvote interactions between users and content." />
                </div>

                {config.upvotes?.enabled && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Brief Upvote Ratio</label>
                        <Tooltip content="Percentage of users who upvote briefs they view." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.upvotes.briefUpvoteRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            upvotes: { ...config.upvotes!, briefUpvoteRatio: parseInt(e.target.value) / 100 }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.upvotes.briefUpvoteRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {showAdvanced && (
                      <>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <label className="text-xs text-gray-600">Review Upvote Ratio</label>
                            <Tooltip content="Percentage of users who upvote reviews they find helpful." />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              value={config.upvotes.reviewUpvoteRatio! * 100}
                              onChange={(e) => setConfig({
                                ...config,
                                upvotes: { ...config.upvotes!, reviewUpvoteRatio: parseInt(e.target.value) / 100 }
                              })}
                              min="0"
                              max="100"
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">
                              {Math.round((config.upvotes.reviewUpvoteRatio || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <label className="text-xs text-gray-600">Max Upvotes per User</label>
                            <Tooltip content="Maximum number of upvotes any single user can give." />
                          </div>
                          <Input
                            type="number"
                            value={config.upvotes.maxUpvotesPerUser}
                            onChange={(e) => setConfig({
                              ...config,
                              upvotes: { ...config.upvotes!, maxUpvotesPerUser: parseInt(e.target.value) || 50 }
                            })}
                            min="1"
                            max="1000"
                            className="w-24"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="savedBriefsEnabled"
                    checked={config.savedBriefs?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      savedBriefs: { ...config.savedBriefs!, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="savedBriefsEnabled" className="text-sm font-medium text-gray-700">
                    Generate Saved Briefs
                  </label>
                  <Tooltip content="Create saved/bookmarked briefs for users' reading lists." />
                </div>

                {config.savedBriefs?.enabled && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Save Ratio</label>
                        <Tooltip content="Percentage of users who save briefs for later reading." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.savedBriefs.saveRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            savedBriefs: { ...config.savedBriefs!, saveRatio: parseInt(e.target.value) / 100 }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.savedBriefs.saveRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {showAdvanced && (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <label className="text-xs text-gray-600">Max Saves per User</label>
                          <Tooltip content="Maximum number of briefs any user can save." />
                        </div>
                        <Input
                          type="number"
                          value={config.savedBriefs.maxSavesPerUser}
                          onChange={(e) => setConfig({
                            ...config,
                            savedBriefs: { ...config.savedBriefs!, maxSavesPerUser: parseInt(e.target.value) || 30 }
                          })}
                          min="1"
                          max="500"
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="briefViewsEnabled"
                    checked={config.briefViews?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      briefViews: { ...config.briefViews!, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="briefViewsEnabled" className="text-sm font-medium text-gray-700">
                    Generate Brief Views
                  </label>
                  <Tooltip content="Track which users have viewed which briefs." />
                </div>

                {config.briefViews?.enabled && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">View Ratio</label>
                        <Tooltip content="Percentage of users who actively view briefs." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.briefViews.viewRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            briefViews: { ...config.briefViews!, viewRatio: parseInt(e.target.value) / 100 }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.briefViews.viewRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {showAdvanced && (
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="multipleViews"
                          checked={config.briefViews.multipleViewsPerUser}
                          onChange={(e) => setConfig({
                            ...config,
                            briefViews: { ...config.briefViews!, multipleViewsPerUser: e.target.checked }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="multipleViews" className="text-xs text-gray-600">
                          Allow multiple views per user
                        </label>
                        <Tooltip content="Whether users can view the same brief multiple times (tracked separately)." />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="tokensEnabled"
                    checked={config.tokens?.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      tokens: { ...config.tokens!, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="tokensEnabled" className="text-sm font-medium text-gray-700">
                    Generate Token Economy
                  </label>
                  <Tooltip content="Create token balances, transactions, and purchase history." />
                </div>

                {config.tokens?.enabled && showAdvanced && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Initial Balance Range</label>
                        <Tooltip content="Range of starting token balances for users." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={config.tokens.initialBalanceRange?.[0]}
                          onChange={(e) => setConfig({
                            ...config,
                            tokens: {
                              ...config.tokens!,
                              initialBalanceRange: [parseInt(e.target.value) || 0, config.tokens!.initialBalanceRange![1]]
                            }
                          })}
                          placeholder="Min"
                          className="w-24"
                          min="0"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="number"
                          value={config.tokens.initialBalanceRange?.[1]}
                          onChange={(e) => setConfig({
                            ...config,
                            tokens: {
                              ...config.tokens!,
                              initialBalanceRange: [config.tokens!.initialBalanceRange![0], parseInt(e.target.value) || 0]
                            }
                          })}
                          placeholder="Max"
                          className="w-24"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-xs text-gray-600">Purchase Ratio</label>
                        <Tooltip content="Percentage of users who have purchased tokens." />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          value={config.tokens.purchaseRatio! * 100}
                          onChange={(e) => setConfig({
                            ...config,
                            tokens: { ...config.tokens!, purchaseRatio: parseInt(e.target.value) / 100 }
                          })}
                          min="0"
                          max="100"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {Math.round((config.tokens.purchaseRatio || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Data Skewing */}
        <CollapsibleSection
          title="Data Patterns & Skewing"
          icon={<Shuffle className="w-5 h-5 text-indigo-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="powerUsers"
                    checked={config.dataSkew?.powerUsers}
                    onChange={(e) => setConfig({
                      ...config,
                      dataSkew: { ...config.dataSkew!, powerUsers: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="powerUsers" className="text-sm font-medium text-gray-700">
                    Create Power Users
                  </label>
                  <Tooltip content="10% of users will generate 50% of all activity (realistic user distribution)." />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="viralBriefs"
                    checked={config.dataSkew?.viralBriefs}
                    onChange={(e) => setConfig({
                      ...config,
                      dataSkew: { ...config.dataSkew!, viralBriefs: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="viralBriefs" className="text-sm font-medium text-gray-700">
                    Create Viral Briefs
                  </label>
                  <Tooltip content="5% of briefs will receive 10x normal engagement (viral content simulation)." />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="controversialContent"
                    checked={config.dataSkew?.controversialContent}
                    onChange={(e) => setConfig({
                      ...config,
                      dataSkew: { ...config.dataSkew!, controversialContent: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="controversialContent" className="text-sm font-medium text-gray-700">
                    Create Controversial Content
                  </label>
                  <Tooltip content="Some content will have highly polarized ratings (either 1 or 5 stars)." />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Time Distribution
                  </label>
                  <Tooltip content="How content creation dates are distributed over time." />
                </div>
                <Select
                  value={config.dataSkew?.timeDistribution}
                  onChange={(e) => setConfig({
                    ...config,
                    dataSkew: { ...config.dataSkew!, timeDistribution: e.target.value as any }
                  })}
                  options={[
                    { value: 'uniform', label: 'Uniform (even distribution)' },
                    { value: 'recent', label: 'Recent (more recent data)' },
                    { value: 'exponential', label: 'Exponential (growth over time)' },
                  ]}
                />

                <div className="mt-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Date Range
                    </label>
                    <Tooltip content="The time period over which to distribute created content." />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={config.dataSkew?.startDate ? 
                        new Date(config.dataSkew.startDate).toISOString().split('T')[0] : 
                        ''
                      }
                      onChange={(e) => setConfig({
                        ...config,
                        dataSkew: { ...config.dataSkew!, startDate: new Date(e.target.value) }
                      })}
                    />
                    <Input
                      type="date"
                      value={config.dataSkew?.endDate ? 
                        new Date(config.dataSkew.endDate).toISOString().split('T')[0] : 
                        ''
                      }
                      onChange={(e) => setConfig({
                        ...config,
                        dataSkew: { ...config.dataSkew!, endDate: new Date(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Advanced Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Console Output */}
      {consoleOutput.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">Console Output</h3>
            <button
              onClick={() => setConsoleOutput([])}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="font-mono text-xs text-gray-300 space-y-1">
            {consoleOutput.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Console Command</span>
              <button
                onClick={copyCommand}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <code className="text-xs font-mono text-gray-600 break-all">
              {generateConsoleCommand()}
            </code>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSeed}
                disabled={isSeeding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Seeding
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={exportConfig}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Config
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>This will modify your database</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}