// app/admin/data-synth/page.tsx
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
  Calendar
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { seed, type SeedConfig } from '@/server/actions/seed';

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
      maxVersionsPerBrief: 3
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
    }
  });

  // Relational configuration state
  const [relationalConfig, setRelationalConfig] = useState({
    userBriefCorrelation: 'normal', // 'normal', 'powerLaw', 'uniform'
    reviewAuthorship: 'diverse', // 'diverse', 'concentrated', 'reciprocal'
    categoryDistribution: 'balanced', // 'balanced', 'skewed', 'hierarchical'
    temporalClustering: 'none', // 'none', 'weekly', 'monthly', 'events'
    engagementPatterns: 'organic', // 'organic', 'viral', 'steady', 'declining'
    tokenEconomy: 'balanced', // 'balanced', 'inflationary', 'deflationary'
    networkEffects: {
      followPattern: 'random', // 'random', 'preferential', 'community'
      interactionDensity: 0.3, // 0-1 scale
      clusteringCoefficient: 0.5, // 0-1 scale
    }
  });

  const handlePresetSelect = (preset: PresetConfig) => {
    setActivePreset(preset.name);
    setConfig(prev => ({
      ...prev,
      ...preset.config
    }));
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

  const generateConsoleCommand = () => {
  let command = 'npm run db:seed';
  
  // Basic flags
  if (!config.deleteAll) command += ' --no-delete';
  if (config.users?.count) command += ` --users ${config.users.count}`;
  if (config.briefs?.count) command += ` --briefs ${config.briefs.count}`;
  if (config.sources?.count) command += ` --sources ${config.sources.count}`;
  if (config.categories?.count) command += ` --categories ${config.categories.count}`;
  
  // Data skew flags
  if (config.dataSkew?.powerUsers) command += ' --power-users';
  if (config.dataSkew?.viralBriefs) command += ' --viral';
  if (config.dataSkew?.controversialContent) command += ' --controversial';
  if (config.dataSkew?.timeDistribution && config.dataSkew.timeDistribution !== 'uniform') {
    command += ` --time-dist ${config.dataSkew.timeDistribution}`;
  }
  
  // Relational pattern flags
  if (config.relationalPatterns?.userBriefCorrelation && config.relationalPatterns.userBriefCorrelation !== 'normal') {
    command += ` --user-brief-correlation ${config.relationalPatterns.userBriefCorrelation}`;
  }
  if (config.relationalPatterns?.reviewAuthorship && config.relationalPatterns.reviewAuthorship !== 'diverse') {
    command += ` --review-authorship ${config.relationalPatterns.reviewAuthorship}`;
  }
  if (config.relationalPatterns?.categoryDistribution && config.relationalPatterns.categoryDistribution !== 'balanced') {
    command += ` --category-dist ${config.relationalPatterns.categoryDistribution}`;
  }
  if (config.relationalPatterns?.engagementPatterns && config.relationalPatterns.engagementPatterns !== 'organic') {
    command += ` --engagement ${config.relationalPatterns.engagementPatterns}`;
  }
  
  // Token economy
  if (config.tokens?.economyType && config.tokens.economyType !== 'balanced') {
    command += ` --economy ${config.tokens.economyType}`;
  }
  if (config.tokens?.whaleRatio && config.tokens.whaleRatio > 0) {
    command += ` --whale-ratio ${config.tokens.whaleRatio}`;
  }
  
  // Quality distribution
  if (config.briefs?.qualityDistribution) {
    const high = config.briefs.qualityDistribution.high || 0.2;
    const medium = config.briefs.qualityDistribution.medium || 0.6;
    const low = config.briefs.qualityDistribution.low || 0.2;
    if (high !== 0.2 || medium !== 0.6 || low !== 0.2) {
      command += ` --quality-dist ${high},${medium},${low}`;
    }
  }
  
  // Versions
  if (config.briefs?.versionsEnabled) {
    command += ' --versions';
    if (config.briefs.maxVersionsPerBrief && config.briefs.maxVersionsPerBrief !== 3) {
      command += ` --max-versions ${config.briefs.maxVersionsPerBrief}`;
    }
  }
  
  // Admin ratio
  if (config.users?.adminRatio && config.users.adminRatio !== 0.05) {
    command += ` --admin-ratio ${config.users.adminRatio}`;
  }
  
  // Published ratio
  if (config.briefs?.publishedRatio && config.briefs.publishedRatio !== 0.9) {
    command += ` --published-ratio ${config.briefs.publishedRatio}`;
  }
  
  // Date range
  if (config.dataSkew?.startDate) {
    command += ` --start-date ${config.dataSkew.startDate.toISOString().split('T')[0]}`;
  }
  if (config.dataSkew?.endDate) {
    command += ` --end-date ${config.dataSkew.endDate.toISOString().split('T')[0]}`;
  }
  
  return command;
};

  const copyCommand = () => {
    navigator.clipboard.writeText(generateConsoleCommand());
  };

  const exportConfig = () => {
    const configJson = JSON.stringify({ ...config, relationalConfig }, null, 2);
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
            </div>
            
            {!config.deleteAll && (
              <div className="ml-7 space-y-2">
                <p className="text-sm text-gray-600">Select specific tables to delete:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['users', 'briefs', 'reviews', 'categories', 'sources', 'tokens'].map((table) => (
                    <label key={table} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.deleteTables?.includes(table) || false}
                        onChange={(e) => {
                          const tables = config.deleteTables || [];
                          setConfig({
                            ...config,
                            deleteTables: e.target.checked
                              ? [...tables, table]
                              : tables.filter(t => t !== table)
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">{table}</span>
                    </label>
                  ))}
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
            </div>

            {config.users?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Users
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Ratio
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Verified Ratio
                  </label>
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
                          <label className="text-xs text-gray-600">Email Notifications</label>
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
            </div>

            {config.briefs?.enabled && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Briefs
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Ratio
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      View Count Range
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categories per Brief
                    </label>
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
                </div>

                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Advanced Brief Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          With Abstract Ratio
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          With Thinking Process Ratio
                        </label>
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
                        </div>
                        
                        {config.briefs.versionsEnabled && (
                          <div className="mt-2 ml-7">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max Versions per Brief
                            </label>
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
            </div>

            {config.reviews?.enabled && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reviews per Brief Range
                  </label>
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

                {showAdvanced && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating Distribution
                    </label>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 w-20">
                            {'⭐'.repeat(rating)}
                          </span>
                          <input
                            type="range"
                            value={(config.reviews?.ratingDistribution?.[rating] ?? 0) * 100}
                            onChange={(e) => setConfig({
                              ...config,
                              reviews: {
                                ...config.reviews!,
                                ratingDistribution: {
                                  ...config.reviews!.ratingDistribution!,
                                  [rating]: parseInt(e.target.value) / 100
                                }
                              }
                            })}
                            min="0"
                            max="100"
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round((config.reviews?.ratingDistribution?.[rating] ?? 0) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              </div>

              {config.aiReviews?.enabled && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Reviews per Brief Range
                  </label>
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
                </div>

                {config.upvotes?.enabled && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Brief Upvote Ratio</label>
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
                </div>

                {config.savedBriefs?.enabled && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Save Ratio</label>
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
                    Create Power Users (10% users, 50% activity)
                  </label>
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
                    Create Viral Briefs (5% briefs, 10x engagement)
                  </label>
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
                    Create Controversial Content (mixed ratings)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Distribution
                </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
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

        {/* Relational Patterns */}
        <CollapsibleSection
          title="Relational Patterns"
          icon={<GitBranch className="w-5 h-5 text-cyan-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User-Brief Correlation
                </label>
                <Select
                  value={relationalConfig.userBriefCorrelation}
                  onChange={(e) => setRelationalConfig({
                    ...relationalConfig,
                    userBriefCorrelation: e.target.value
                  })}
                  options={[
                    { value: 'normal', label: 'Normal Distribution' },
                    { value: 'powerLaw', label: 'Power Law (few create most)' },
                    { value: 'uniform', label: 'Uniform (equal creation)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Authorship Pattern
                </label>
                <Select
                  value={relationalConfig.reviewAuthorship}
                  onChange={(e) => setRelationalConfig({
                    ...relationalConfig,
                    reviewAuthorship: e.target.value
                  })}
                  options={[
                    { value: 'diverse', label: 'Diverse (many authors)' },
                    { value: 'concentrated', label: 'Concentrated (few reviewers)' },
                    { value: 'reciprocal', label: 'Reciprocal (mutual reviews)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Distribution
                </label>
                <Select
                  value={relationalConfig.categoryDistribution}
                  onChange={(e) => setRelationalConfig({
                    ...relationalConfig,
                    categoryDistribution: e.target.value
                  })}
                  options={[
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'skewed', label: 'Skewed (popular categories)' },
                    { value: 'hierarchical', label: 'Hierarchical (parent-child)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engagement Pattern
                </label>
                <Select
                  value={relationalConfig.engagementPatterns}
                  onChange={(e) => setRelationalConfig({
                    ...relationalConfig,
                    engagementPatterns: e.target.value
                  })}
                  options={[
                    { value: 'organic', label: 'Organic Growth' },
                    { value: 'viral', label: 'Viral Spikes' },
                    { value: 'steady', label: 'Steady State' },
                    { value: 'declining', label: 'Declining Activity' },
                  ]}
                />
              </div>
            </div>

            {showAdvanced && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Network Effects</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interaction Density
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={relationalConfig.networkEffects.interactionDensity * 100}
                        onChange={(e) => setRelationalConfig({
                          ...relationalConfig,
                          networkEffects: {
                            ...relationalConfig.networkEffects,
                            interactionDensity: parseInt(e.target.value) / 100
                          }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round(relationalConfig.networkEffects.interactionDensity * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      How likely users are to interact with each other's content
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clustering Coefficient
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        value={relationalConfig.networkEffects.clusteringCoefficient * 100}
                        onChange={(e) => setRelationalConfig({
                          ...relationalConfig,
                          networkEffects: {
                            ...relationalConfig.networkEffects,
                            clusteringCoefficient: parseInt(e.target.value) / 100
                          }
                        })}
                        min="0"
                        max="100"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {Math.round(relationalConfig.networkEffects.clusteringCoefficient * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tendency for users to form tight-knit communities
                    </p>
                  </div>
                </div>
              </div>
            )}
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
