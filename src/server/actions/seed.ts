// app/server/actions/seed.ts
'use server';

import { db } from "@/server/db";
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import * as sampleData from './seed-data';

export interface SeedConfig {
  // Delete options
  deleteAll?: boolean;
  deleteTables?: string[];

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
    providersDistribution?: Record<string, number>; // e.g., { google: 0.7, github: 0.3 }
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
    ratingDistribution?: Record<number, number>; // e.g., { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.3 }
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
    whaleRatio?: number; // Percentage of users with significantly more tokens
  };

  exports?: {
    enabled: boolean;
    exportsPerUser?: [number, number];
    formatDistribution?: Record<string, number>;
  };

  // Relationships and data skewing
  dataSkew?: {
    powerUsers?: boolean; // Create some users with significantly more activity
    viralBriefs?: boolean; // Create some briefs with significantly more engagement
    controversialContent?: boolean; // Create content with mixed ratings
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
      interactionDensity?: number; // 0-1 scale
      clusteringCoefficient?: number; // 0-1 scale
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

// Default configuration for initial seeding
const DEFAULT_CONFIG: SeedConfig = {
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
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
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

export interface DatabaseSafetyCheck {
  isSafe: boolean;
  nonSeedData: {
    type: string;
    count: number;
    examples: string[];
  }[];
  totalNonSeedRecords: number;
  warnings: string[];
}
// Add seeding metadata tracking
export async function trackSeedingMetadata(config: SeedConfig, summary: any) {
  await db.seedingMetadata.upsert({
    where: { id: 'current' },
    update: {
      lastSeedDate: new Date(),
      seedVersion: '1.0',
      totalSeedRecords: Object.values(summary).reduce((sum: number, val: any) => sum + (val as number), 0),
      config: JSON.stringify(config),
    },
    create: {
      id: 'current',
      lastSeedDate: new Date(),
      seedVersion: '1.0',
      totalSeedRecords: Object.values(summary).reduce((sum: number, val: any) => sum + (val as number), 0),
      config: JSON.stringify(config),
    },
  });
}

// Enhanced safety verification
export async function verifyDatabaseSafety(): Promise<DatabaseSafetyCheck> {
  const nonSeedData: { type: string; count: number; examples: string[]; confidence: 'high' | 'medium' | 'low' }[] = [];
  const warnings: string[] = [];
  let totalNonSeedRecords = 0;

  try {
    // Get seeding metadata if available
    const seedingMetadata = await db.seedingMetadata.findUnique({
      where: { id: 'current' }
    }).catch(() => null);

    // Check users - only look for records where isSeedData is false or null
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isSeedData: true,
      }
    });

    const nonSeedUsers = users.filter(user => {
      // Allow demo user
      if (user.email === 'demo@deepscholar.local') return false;
      
      // Only flag users where isSeedData is explicitly false or null/undefined
      return user.isSeedData !== true;
    });

    if (nonSeedUsers.length > 0) {
      nonSeedData.push({
        type: 'Users',
        count: nonSeedUsers.length,
        examples: nonSeedUsers.slice(0, 3).map(u => u.name || u.email || 'Unknown'),
        confidence: 'high'
      });
      totalNonSeedRecords += nonSeedUsers.length;
    }

    // Check briefs - only look for records where isSeedData is false or null
    const briefs = await db.brief.findMany({
      select: {
        id: true,
        title: true,
        prompt: true,
        createdAt: true,
        isSeedData: true,
        author: {
          select: {
            email: true,
          }
        }
      }
    });

    const nonSeedBriefs = briefs.filter(brief => {
      // Allow demo user briefs
      if (brief.author.email === 'demo@deepscholar.local') return false;
      
      // Only flag briefs where isSeedData is explicitly false or null/undefined
      return brief.isSeedData !== true;
    });

    if (nonSeedBriefs.length > 0) {
      nonSeedData.push({
        type: 'Briefs',
        count: nonSeedBriefs.length,
        examples: nonSeedBriefs.slice(0, 3).map(b => b.title || 'Untitled'),
        confidence: 'high'
      });
      totalNonSeedRecords += nonSeedBriefs.length;
    }

    // Add environment-based warnings
    if (process.env.NODE_ENV === 'production') {
      warnings.push('Running in production environment - extra caution advised');
    }

    return {
      isSafe: totalNonSeedRecords === 0,
      nonSeedData,
      totalNonSeedRecords,
      warnings,
      seedingMetadata: seedingMetadata ? {
        lastSeedDate: seedingMetadata.lastSeedDate,
        seedVersion: seedingMetadata.seedVersion,
        totalSeedRecords: seedingMetadata.totalSeedRecords,
      } : undefined,
    };

  } catch (error) {
    console.error('Error checking database safety:', error);
    return {
      isSafe: false,
      nonSeedData: [],
      totalNonSeedRecords: 0,
      warnings: ['Error occurred while checking database safety - proceed with caution'],
    };
  }
}



// Helper functions
function getRandomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot get random element from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  if (array.length === 0) return [];
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getWeightedRandom<T>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  
  if (totalWeight === 0) {
    return entries[0][0];
  }
  
  let random = Math.random() * totalWeight;
  
  for (const [value, weight] of entries) {
    random -= weight;
    if (random <= 0) return value;
  }
  
  return entries[0][0];
}

function getSkewedDate(config: SeedConfig): Date {
  const start = config.dataSkew?.startDate?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
  const end = config.dataSkew?.endDate?.getTime() || Date.now();
  
  switch (config.dataSkew?.timeDistribution) {
    case 'recent':
      // More recent dates are more likely
      const recentBias = Math.pow(Math.random(), 2);
      return new Date(start + (end - start) * recentBias);
    case 'exponential':
      // Exponential growth over time
      const expBias = Math.pow(Math.random(), 0.5);
      return new Date(start + (end - start) * expBias);
    case 'uniform':
    default:
      return faker.date.between({ from: new Date(start), to: new Date(end) });
  }
}

function normalizeDistribution(distribution: Record<any, number>): Record<any, number> {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  if (total === 0) return distribution;
  
  const normalized: Record<any, number> = {};
  for (const [key, value] of Object.entries(distribution)) {
    normalized[key] = value / total;
  }
  return normalized;
}

function validateConfig(config: SeedConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate rating distributions sum to ~1.0
  if (config.reviews?.ratingDistribution) {
    const total = Object.values(config.reviews.ratingDistribution).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`Review rating distribution should sum to 1.0, got ${total}`);
    }
  }
  
  if (config.aiReviews?.ratingDistribution) {
    const total = Object.values(config.aiReviews.ratingDistribution).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      errors.push(`AI review rating distribution should sum to 1.0, got ${total}`);
    }
  }
  
  // Validate ranges
  if (config.briefs?.viewCountRange && config.briefs.viewCountRange[0] > config.briefs.viewCountRange[1]) {
    errors.push('Brief view count range minimum cannot be greater than maximum');
  }
  
  // Check for dependency issues
  if (config.briefs?.enabled && !config.users?.enabled) {
    errors.push('Cannot create briefs without users');
  }
  
  if (config.reviews?.enabled && (!config.users?.enabled || !config.briefs?.enabled)) {
    errors.push('Cannot create reviews without users and briefs');
  }
  
  if (config.upvotes?.enabled && (!config.users?.enabled || !config.briefs?.enabled)) {
    errors.push('Cannot create upvotes without users and briefs');
  }
  
  return { valid: errors.length === 0, errors };
}

// Progress tracking
class ProgressTracker {
  private totalSteps: number = 0;
  private currentStep: number = 0;
  private callback?: (message: string, percentage?: number) => void;
  
  constructor(callback?: (message: string, percentage?: number) => void) {
    this.callback = callback;
  }
  
  setTotalSteps(steps: number) {
    this.totalSteps = steps;
  }
  
  increment(message: string) {
    this.currentStep++;
    const percentage = this.totalSteps > 0 ? Math.round((this.currentStep / this.totalSteps) * 100) : 0;
    this.report(message, percentage);
  }
  
  report(message: string, percentage?: number) {
    console.log(`[${percentage ?? 0}%] ${message}`);
    if (this.callback) {
      this.callback(message, percentage);
    }
  }
}

// Main seeding function
export async function seed(config: SeedConfig = DEFAULT_CONFIG) {
  console.log('🌱 Starting database seed...');
  const startTime = Date.now();
  const progress = new ProgressTracker(config.onProgress);
  
  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('❌ Configuration validation failed:', validation.errors);
    return {
      success: false,
      error: `Configuration errors: ${validation.errors.join(', ')}`,
    };
  }

  if (config.deleteAll || config.deleteTables?.length) {
    console.log('🔍 Performing database safety check...');
    const safetyCheck = await verifyDatabaseSafety();
    
    if (!safetyCheck.isSafe) {
      return {
        success: false,
        error: 'Database safety check failed - non-seed data detected',
        safetyCheck,
      };
    }
  }
  
  // Normalize distributions
  if (config.reviews?.ratingDistribution) {
    config.reviews.ratingDistribution = normalizeDistribution(config.reviews.ratingDistribution);
  }
  if (config.aiReviews?.ratingDistribution) {
    config.aiReviews.ratingDistribution = normalizeDistribution(config.aiReviews.ratingDistribution);
  }
  
  try {
    // Calculate total steps for progress tracking
    let totalSteps = 1; // Deletion
    if (config.users?.enabled) totalSteps++;
    if (config.researchAIModels?.enabled) totalSteps++;
    if (config.reviewAIModels?.enabled) totalSteps++;
    if (config.categories?.enabled) totalSteps++;
    if (config.sources?.enabled) totalSteps++;
    if (config.briefs?.enabled) totalSteps++;
    if (config.reviews?.enabled) totalSteps++;
    if (config.aiReviews?.enabled) totalSteps++;
    if (config.upvotes?.enabled) totalSteps++;
    if (config.savedBriefs?.enabled) totalSteps++;
    if (config.briefViews?.enabled) totalSteps++;
    if (config.tokens?.enabled) totalSteps++;
    if (config.exports?.enabled) totalSteps++;
    
    progress.setTotalSteps(totalSteps);
    
    // Handle deletion
    if (config.deleteAll) {
      progress.report('🗑️ Deleting all data...');
      await deleteAllData();
    } else if (config.deleteTables?.length) {
      progress.report(`🗑️ Deleting data from tables: ${config.deleteTables.join(', ')}`);
      await deleteTableData(config.deleteTables);
    }
    progress.increment('✅ Data deletion complete');

    const createdData = {
      users: [] as any[],
      researchAIModels: [] as any[],
      reviewAIModels: [] as any[],
      categories: [] as any[],
      sources: [] as any[],
      briefs: [] as any[],
      reviews: [] as any[],
      aiReviews: [] as any[],
      powerUsers: [] as any[],
      viralBriefs: [] as any[],
    };

    // Create Users
    if (config.users?.enabled) {
      progress.report(`👤 Creating ${config.users.count} users...`);
      createdData.users = await createUsers(config, createdData);
      progress.increment(`✅ Created ${createdData.users.length} users`);
    }

    // Create AI Models
    if (config.researchAIModels?.enabled) {
      progress.report('🤖 Creating research AI models...');
      createdData.researchAIModels = await createResearchAIModels(config);
      progress.increment(`✅ Created ${createdData.researchAIModels.length} research AI models`);
    }

    if (config.reviewAIModels?.enabled) {
      progress.report('🤖 Creating review AI models...');
      createdData.reviewAIModels = await createReviewAIModels(config);
      progress.increment(`✅ Created ${createdData.reviewAIModels.length} review AI models`);
    }

    // Create Categories
    if (config.categories?.enabled) {
      progress.report('📁 Creating categories...');
      createdData.categories = await createCategories(config);
      progress.increment(`✅ Created ${createdData.categories.length} categories`);
    }

    // Create Sources
    if (config.sources?.enabled) {
      progress.report(`🔗 Creating ${config.sources.count} sources...`);
      createdData.sources = await createSources(config);
      progress.increment(`✅ Created ${createdData.sources.length} sources`);
    }

    // Create Briefs
    if (config.briefs?.enabled) {
      if (createdData.users.length === 0) {
        throw new Error('Cannot create briefs without users. Enable user creation or ensure users exist.');
      }
      if (createdData.researchAIModels.length === 0) {
        throw new Error('Cannot create briefs without AI models. Enable AI model creation.');
      }
      
      progress.report(`📝 Creating ${config.briefs.count} briefs...`);
      createdData.briefs = await createBriefs(config, createdData);
      progress.increment(`✅ Created ${createdData.briefs.length} briefs`);
    }

    // Create Reviews
    if (config.reviews?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping reviews: requires users and briefs');
      } else {
        progress.report('⭐ Creating user reviews...');
        createdData.reviews = await createReviews(config, createdData);
        progress.increment(`✅ Created ${createdData.reviews.length} reviews`);
      }
    }

    // Create AI Reviews
    if (config.aiReviews?.enabled) {
      if (createdData.briefs.length === 0 || createdData.reviewAIModels.length === 0) {
        console.warn('⚠️ Skipping AI reviews: requires briefs and review AI models');
      } else {
        progress.report('🤖 Creating AI reviews...');
        createdData.aiReviews = await createAIReviews(config, createdData);
        progress.increment(`✅ Created ${createdData.aiReviews.length} AI reviews`);
      }
    }

    // Create Upvotes
    if (config.upvotes?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping upvotes: requires users and briefs');
      } else {
        progress.report('👍 Creating upvotes...');
        await createUpvotes(config, createdData);
        progress.increment('✅ Upvotes created');
      }
    }

    // Create Saved Briefs
    if (config.savedBriefs?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping saved briefs: requires users and briefs');
      } else {
        progress.report('💾 Creating saved briefs...');
        await createSavedBriefs(config, createdData);
        progress.increment('✅ Saved briefs created');
      }
    }

    // Create Brief Views
    if (config.briefViews?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping brief views: requires users and briefs');
      } else {
        progress.report('👁️ Creating brief views...');
        await createBriefViews(config, createdData);
        progress.increment('✅ Brief views created');
      }
    }

    // Create Token Data
    if (config.tokens?.enabled) {
      if (createdData.users.length === 0) {
        console.warn('⚠️ Skipping token data: requires users');
      } else {
        progress.report('💰 Creating token balances and transactions...');
        await createTokenData(config, createdData);
        progress.increment('✅ Token data created');
      }
    }

    // Create Export History
    if (config.exports?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping export history: requires users and briefs');
      } else {
        progress.report('📤 Creating export history...');
        await createExportHistory(config, createdData);
        progress.increment('✅ Export history created');
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    progress.report(`✅ Seeding completed in ${duration}s`, 100);

    await trackSeedingMetadata(config, {
      users: createdData.users.length,
      briefs: createdData.briefs.length,
      reviews: createdData.reviews.length,
      aiReviews: createdData.aiReviews.length,
      categories: createdData.categories.length,
      sources: createdData.sources.length,
      researchAIModels: createdData.researchAIModels.length,
      reviewAIModels: createdData.reviewAIModels.length,
    });
    
    
    return {
      success: true,
      duration: `${duration}s`,
      summary: {
        users: createdData.users.length,
        briefs: createdData.briefs.length,
        reviews: createdData.reviews.length,
        aiReviews: createdData.aiReviews.length,
        categories: createdData.categories.length,
        sources: createdData.sources.length,
      },
    };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
}

// Delete functions
async function deleteAllData() {
  await db.$transaction([
    db.exportUsage.deleteMany(),
    db.exportHistory.deleteMany(),
    db.reviewHelpful.deleteMany(),
    db.tokenPurchase.deleteMany(),
    db.tokenTransaction.deleteMany(),
    db.userToken.deleteMany(),
    db.briefView.deleteMany(),
    db.savedBrief.deleteMany(),
    db.reviewUpvote.deleteMany(),
    db.briefUpvote.deleteMany(),
    db.aIReview.deleteMany(),
    db.review.deleteMany(),
    db.briefReference.deleteMany(),
    db.brief.deleteMany(),
    db.category.deleteMany(),
    db.source.deleteMany(),
    db.reviewAIModel.deleteMany(),
    db.researchAIModel.deleteMany(),
    db.session.deleteMany(),
    db.account.deleteMany(),
    db.verificationToken.deleteMany(),
    db.user.deleteMany(),
  ]);
}

async function deleteTableData(tables: string[]) {
  const deletions = [];
  
  for (const table of tables) {
    switch (table.toLowerCase()) {
      case 'users':
        deletions.push(
          db.exportUsage.deleteMany(),
          db.exportHistory.deleteMany(),
          db.reviewHelpful.deleteMany(),
          db.tokenPurchase.deleteMany(),
          db.tokenTransaction.deleteMany(),
          db.userToken.deleteMany(),
          db.briefView.deleteMany(),
          db.savedBrief.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.briefUpvote.deleteMany(),
          db.review.deleteMany(),
          db.brief.deleteMany(),
          db.session.deleteMany(),
          db.account.deleteMany(),
          db.user.deleteMany()
        );
        break;
      case 'briefs':
        deletions.push(
          db.exportHistory.deleteMany({ where: { exportType: 'brief' } }),
          db.reviewHelpful.deleteMany(),
          db.briefView.deleteMany(),
          db.savedBrief.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.briefUpvote.deleteMany(),
          db.aIReview.deleteMany(),
          db.review.deleteMany(),
          db.briefReference.deleteMany(),
          db.brief.deleteMany()
        );
        break;
      case 'reviews':
        deletions.push(
          db.reviewHelpful.deleteMany(),
          db.reviewUpvote.deleteMany(),
          db.aIReview.deleteMany(),
          db.review.deleteMany()
        );
        break;
      case 'categories':
        deletions.push(db.category.deleteMany());
        break;
      case 'sources':
        deletions.push(
          db.briefReference.deleteMany(),
          db.source.deleteMany()
        );
        break;
      case 'tokens':
        deletions.push(
          db.tokenPurchase.deleteMany(),
          db.tokenTransaction.deleteMany(),
          db.userToken.deleteMany()
        );
        break;
    }
  }
  
  if (deletions.length > 0) {
    await db.$transaction(deletions);
  }
}

// User creation with relational patterns
async function createUsers(config: SeedConfig, createdData: any) {
  const users = [];
  const userCount = config.users?.count || 100;
  
  // Determine power users based on correlation pattern
  const powerUserIndices = new Set<number>();
  if (config.dataSkew?.powerUsers) {
    const powerUserCount = Math.floor(userCount * 0.1);
    
    switch (config.relationalPatterns?.userBriefCorrelation) {
      case 'powerLaw':
        // Top 10% of users
        for (let i = 0; i < powerUserCount; i++) {
          powerUserIndices.add(i);
        }
        break;
      case 'uniform':
        // Random distribution
        while (powerUserIndices.size < powerUserCount) {
          powerUserIndices.add(getRandomInt(0, userCount - 1));
        }
        break;
      case 'normal':
      default:
        // Clustered around middle
        const middle = Math.floor(userCount / 2);
        const spread = Math.floor(userCount / 4);
        for (let i = 0; i < powerUserCount; i++) {
          const index = Math.max(0, Math.min(userCount - 1, 
            Math.floor(middle + (Math.random() - 0.5) * spread * 2)
          ));
          powerUserIndices.add(index);
        }
    }
  }
  
  // Create user cohorts for temporal clustering
  const cohortSize = Math.ceil(userCount / 10);
  const cohortDates: Date[] = [];
  if (config.relationalPatterns?.temporalClustering !== 'none') {
    const start = config.dataSkew?.startDate?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
    const end = config.dataSkew?.endDate?.getTime() || Date.now();
    
    for (let i = 0; i < 10; i++) {
      cohortDates.push(new Date(start + (end - start) * (i / 10)));
    }
  }
  
  for (let i = 0; i < userCount; i++) {
    const isPowerUser = powerUserIndices.has(i);
    const isWhale = config.tokens?.whaleRatio && Math.random() < config.tokens.whaleRatio;
    const isAdmin = Math.random() < (config.users?.adminRatio || 0.05);
    const isEmailVerified = Math.random() < (config.users?.emailVerifiedRatio || 0.8);
    
    // Determine cohort and creation date
    let createdAt: Date;
    if (config.relationalPatterns?.temporalClustering !== 'none' && cohortDates.length > 0) {
      const cohortIndex = Math.floor(i / cohortSize);
      const cohortDate = cohortDates[Math.min(cohortIndex, cohortDates.length - 1)];
      const variance = 7 * 24 * 60 * 60 * 1000; // 7 days variance
      createdAt = new Date(cohortDate.getTime() +  (Math.random() - 0.5) * variance);
    } else {
      createdAt = getSkewedDate(config);
    }
    
    const user = await db.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        emailVerified: isEmailVerified ? faker.date.between({ from: createdAt, to: new Date() }) : null,
        image: faker.image.avatar(),
        isAdmin,
        lastInteractionDate: isPowerUser ? faker.date.recent() : faker.date.between({ from: createdAt, to: new Date() }),
        lastPromotionEmailDate: faker.date.between({ from: createdAt, to: new Date() }),
        emailNotifications: Math.random() < (config.users?.notificationSettings?.emailNotificationsRatio || 0.7),
        briefInterestUpdates: Math.random() < (config.users?.notificationSettings?.briefInterestUpdatesRatio || 0.6),
        promotionalNotifications: Math.random() < (config.users?.notificationSettings?.promotionalNotificationsRatio || 0.5),
        createdAt,
        isSeedData: true,
      },
    });
    
    // Track special users
    if (isPowerUser) {
      createdData.powerUsers.push(user);
    }
    
    // Store whale status for later token creation
    (user as any).isWhale = isWhale;
    (user as any).isPowerUser = isPowerUser;
    
    // Create account for user
    if (config.accounts?.enabled) {
      const provider = getWeightedRandom(config.accounts.providersDistribution || { google: 1 });
      
      await db.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: provider as string,
          providerAccountId: faker.string.uuid(),
          access_token: faker.string.alphanumeric(40),
          refresh_token: faker.string.alphanumeric(40),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      });
    }
    
    users.push(user);
  }
  
  return users;
}

async function createResearchAIModels(config: SeedConfig) {
  const models = config.researchAIModels?.models || [];
  const createdModels = [];
  
  for (const modelConfig of models) {
    const model = await db.researchAIModel.create({
      data: {
        name: modelConfig.name,
        provider: modelConfig.provider,
        version: modelConfig.version,
      },
    });
    createdModels.push(model);
  }
  
  return createdModels;
}

async function createReviewAIModels(config: SeedConfig) {
  const models = config.reviewAIModels?.models || [];
  const createdModels = [];
  
  for (const modelConfig of models) {
    const model = await db.reviewAIModel.create({
      data: {
        name: modelConfig.name,
        provider: modelConfig.provider,
        version: modelConfig.version,
      },
    });
    createdModels.push(model);
  }
  
  return createdModels;
}

async function createCategories(config: SeedConfig) {
  const customCategories = config.categories?.customCategories || 
    sampleData.categories.slice(0, config.categories?.count || 20);
  const createdCategories = [];
  
  // Apply category distribution pattern
  const distribution = config.relationalPatterns?.categoryDistribution || 'balanced';
  
  for (let i = 0; i < customCategories.length; i++) {
    const categoryName = customCategories[i];
    
    // Adjust description based on distribution
    let description = getRandomElement(sampleData.categoryDescriptions);
    if (distribution === 'hierarchical' && i > 5) {
      description = `Subcategory of ${customCategories[i % 5]}. ${description}`;
    }
    
    const category = await db.category.create({
      data: {
        name: categoryName,
        description,
      },
    });
    createdCategories.push(category);
  }
  
  return createdCategories;
}

async function createSources(config: SeedConfig) {
  const sources = [];
  const sourceCount = config.sources?.count || 200;
  
  for (let i = 0; i < sourceCount; i++) {
    const source = await db.source.create({
      data: {
        title: getRandomElement(sampleData.sourceTitles),
        url: config.sources?.urlPatterns?.length 
          ? getRandomElement(config.sources.urlPatterns).replace('{id}', faker.string.uuid())
          : faker.internet.url(),
        createdAt: getSkewedDate(config),
      },
    });
    sources.push(source);
  }
  
  return sources;
}

async function createBriefs(config: SeedConfig, createdData: any) {
  const briefs = [];
  const briefCount = config.briefs?.count || 500;
  
  // Check prerequisites
  if (createdData.users.length === 0) {
    console.warn('⚠️ No users available for brief creation');
    return briefs;
  }
  
  if (createdData.researchAIModels.length === 0) {
    console.warn('⚠️ No AI models available for brief creation');
    return briefs;
  }
  
  // Determine viral briefs
  const viralIndices = new Set<number>();
  if (config.dataSkew?.viralBriefs) {
    const viralCount = Math.floor(briefCount * 0.05);
    while (viralIndices.size < viralCount) {
      viralIndices.add(getRandomInt(0, briefCount - 1));
    }
  }
  
  // Apply user-brief correlation pattern
  const getUserForBrief = (index: number): any => {
    switch (config.relationalPatterns?.userBriefCorrelation) {
      case 'powerLaw':
        // Power users create most content
        if (createdData.powerUsers.length > 0 && Math.random() < 0.7) {
          return getRandomElement(createdData.powerUsers);
        }
        return getRandomElement(createdData.users);
        
      case 'uniform':
        // Even distribution
        return createdData.users[index % createdData.users.length];
        
      case 'normal':
      default:
        // Normal distribution
        return getRandomElement(createdData.users);
    }
  };
  
  // Apply category distribution
  const getCategoriesForBrief = (): any[] => {
    if (createdData.categories.length === 0) return [];
    
    const count = getRandomInt(...(config.briefs?.categoriesPerBrief || [1, 4]));
    
    switch (config.relationalPatterns?.categoryDistribution) {
      case 'skewed':
        // Popular categories get more briefs
        const popularCategories = createdData.categories.slice(0, Math.ceil(createdData.categories.length * 0.3));
        if (Math.random() < 0.7 && popularCategories.length > 0) {
          return getRandomElements(popularCategories, count);
        }
        break;
        
      case 'hierarchical':
        // Related categories cluster together
        const baseIndex = getRandomInt(0, createdData.categories.length - 1);
        const related = [];
        for (let i = 0; i < count; i++) {
          const offset = getRandomInt(-2, 2);
          const index = Math.max(0, Math.min(createdData.categories.length - 1, baseIndex + offset));
          related.push(createdData.categories[index]);
        }
        return related;
    }
    
    return getRandomElements(createdData.categories, count);
  };
  
  // Create briefs with temporal patterns
  for (let i = 0; i < briefCount; i++) {
    const isViral = viralIndices.has(i);
    const isPublished = Math.random() < (config.briefs?.publishedRatio || 0.9);
    const isDraft = !isPublished && Math.random() < (config.briefs?.draftRatio || 0.5);
    
    const author = getUserForBrief(i);
    const selectedCategories = getCategoriesForBrief();
    const sourcesCount = getRandomInt(...(config.briefs?.sourcesPerBrief || [2, 8]));
    const selectedSources = getRandomElements(createdData.sources, sourcesCount);
    
    // Determine quality tier
    const qualityDist = config.briefs?.qualityDistribution || { high: 0.2, medium: 0.6, low: 0.2 };
    const quality = getWeightedRandom(qualityDist);
    
    // Adjust metrics based on quality
    let viewCount: number;
    let accuracy: number;
    
    switch (quality) {
      case 'high':
        viewCount = isViral ? getRandomInt(50000, 200000) : getRandomInt(5000, 20000);
        accuracy = getRandomFloat(4.0, 5.0);
        break;
      case 'low':
        viewCount = isViral ? getRandomInt(10000, 50000) : getRandomInt(0, 1000);
        accuracy = getRandomFloat(2.0, 3.5);
        break;
      case 'medium':
      default:
        viewCount = isViral ? getRandomInt(20000, 100000) : getRandomInt(1000, 10000);
        accuracy = getRandomFloat(3.0, 4.5);
    }
    
    // Apply engagement pattern
    const engagementMultiplier = getEngagementMultiplier(
      config.relationalPatterns?.engagementPatterns || 'organic',
      i / briefCount
    );
    viewCount = Math.floor(viewCount * engagementMultiplier);
    
    const createdAt = getTemporalDate(config, author.createdAt, i, briefCount);
    
    const brief = await db.brief.create({
      data: {
        title: getRandomElement(sampleData.briefTitles),
        prompt: getRandomElement(sampleData.briefPrompts),
        response: getRandomElement(sampleData.briefResponses),
        abstract: Math.random() < (config.briefs?.withAbstractRatio || 0.7) 
          ? getRandomElement(sampleData.briefAbstracts) 
          : null,
        thinking: Math.random() < (config.briefs?.withThinkingRatio || 0.3)
          ? getRandomElement(sampleData.briefThinking)
          : null,
        modelId: getRandomElement(createdData.researchAIModels).id,
        userId: author.id,
        categories: selectedCategories.length > 0 ? {
          connect: selectedCategories.map(c => ({ id: c.id })),
        } : undefined,
        sources: selectedSources.length > 0 ? {
          connect: selectedSources.map(s => ({ id: s.id })),
        } : undefined,
        viewCount,
        readTime: getRandomInt(...(config.briefs?.readTimeRange || [3, 30])),
        accuracy,
        slug: faker.lorem.slug(),
        published: isPublished,
        isDraft,
        createdAt,
        isSeedData: true,
      },
    });
    
    // Track viral briefs
    if (isViral) {
      createdData.viralBriefs.push(brief);
    }
    
    // Create references for this brief
    const referencesCount = Math.min(
      selectedSources.length,
      getRandomInt(...(config.briefs?.referencesPerBrief || [1, 5]))
    );
    
    for (let j = 0; j < referencesCount; j++) {
      await db.briefReference.create({
        data: {
          briefId: brief.id,
          sourceId: selectedSources[j].id,
          highlightedText: getRandomElement(sampleData.highlightedTexts),
          context: Math.random() > 0.5 ? getRandomElement(sampleData.referenceContexts) : null,
        },
      });
    }
    
    briefs.push(brief);
  }
  
  // Create versions for some briefs
if (config.briefs?.versionsEnabled && briefs.length > 0) {
  const briefsWithVersions = getRandomElements(
    briefs.filter(b => b.published && !b.isDraft),
    Math.min(Math.floor(briefs.length * 0.1), 50) // Limit to prevent too many versions
  );
  
  for (const parentBrief of briefsWithVersions) {
    const versionCount = getRandomInt(1, config.briefs?.maxVersionsPerBrief || 3);
    
    for (let v = 2; v <= versionCount + 1; v++) {
      await db.brief.create({
        data: {
          title: `${parentBrief.title} (v${v})`,
          prompt: parentBrief.prompt,
          response: getRandomElement(sampleData.briefResponses),
          abstract: parentBrief.abstract,
          thinking: parentBrief.thinking,
          modelId: getRandomElement(createdData.researchAIModels).id,
          userId: parentBrief.userId,
          viewCount: Math.floor(parentBrief.viewCount * Math.pow(0.7, v - 1)),
          readTime: parentBrief.readTime,
          accuracy: parentBrief.accuracy,
          published: true,
          isDraft: false,
          isActive: false,
          parentBriefId: parentBrief.id,
          versionNumber: v,
          changeLog: getRandomElement(sampleData.changeLogs),
          createdAt: faker.date.between({ 
            from: parentBrief.createdAt, 
            to: new Date() 
          }),
          isSeedData: true, // Add this line
        },
      });
    }
  }
}
  
  return briefs;
}

async function createReviews(config: SeedConfig, createdData: any) {
  const reviews = [];
  const ratingDist = normalizeDistribution(
    config.reviews?.ratingDistribution || { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35, 5: 0.3 }
  );
  
  // Apply review authorship pattern
  const getReviewAuthor = (brief: any): any => {
    switch (config.relationalPatterns?.reviewAuthorship) {
      case 'concentrated':
        // Few users write most reviews
        if (createdData.powerUsers.length > 0 && Math.random() < 0.6) {
          return getRandomElement(createdData.powerUsers);
        }
        break;
        
      case 'reciprocal':
        // Users review each other's content
        const otherUsers = createdData.users.filter((u: any) => u.id !== brief.userId);
        if (otherUsers.length > 0) {
          return getRandomElement(otherUsers);
        }
        break;
    }
    
    return getRandomElement(createdData.users);
  };
  
  for (const brief of createdData.briefs) {
    const isViralBrief = createdData.viralBriefs.includes(brief);
    const reviewCountRange = config.reviews?.reviewsPerBrief || [0, 15];
    let reviewCount = getRandomInt(...reviewCountRange);
    
    // Viral briefs get more reviews
    if (isViralBrief) {
      reviewCount = Math.floor(reviewCount * 3);
    }
    
    // Quality correlation - better briefs get more reviews
    if (brief.accuracy >= 4.0) {
      reviewCount = Math.floor(reviewCount * 1.5);
    }
    
    const reviewAuthors = new Set<string>();
    
    for (let i = 0; i < reviewCount; i++) {
      const author = getReviewAuthor(brief);
      
      // Prevent duplicate reviews from same author
      if (reviewAuthors.has(author.id)) continue;
      reviewAuthors.add(author.id);
      
      let rating = parseInt(getWeightedRandom(ratingDist) as any);
      
      // Controversial content gets mixed ratings
      if (config.dataSkew?.controversialContent && Math.random() < 0.1) {
        rating = Math.random() < 0.5 ? 1 : 5;
      }
      
      // Quality correlation
      if (brief.accuracy >= 4.0 && rating < 3) {
        rating = Math.min(5, rating + 2);
      } else if (brief.accuracy <= 3.0 && rating > 3) {
        rating = Math.max(1, rating - 1);
      }
      
      const review = await db.review.create({
        data: {
          content: getRandomElement(sampleData.reviewContents[rating] || sampleData.reviewContents[3]),
          rating,
          briefId: brief.id,
          userId: author.id,
          createdAt: faker.date.between({ 
            from: brief.createdAt, 
            to: new Date() 
          }),
        },
      });
      reviews.push(review);
    }
  }
  
  return reviews;
}

async function createAIReviews(config: SeedConfig, createdData: any) {
  const aiReviews = [];
  const ratingDist = normalizeDistribution(
    config.aiReviews?.ratingDistribution || { 1: 0.02, 2: 0.08, 3: 0.25, 4: 0.40, 5: 0.25 }
  );
  
  for (const brief of createdData.briefs) {
    const aiReviewCount = getRandomInt(...(config.aiReviews?.aiReviewsPerBrief || [0, 3]));
    
    for (let i = 0; i < aiReviewCount; i++) {
      let rating = parseInt(getWeightedRandom(ratingDist) as any);
      
      // AI reviews correlate with actual quality
      if (brief.accuracy >= 4.5) {
        rating = Math.max(4, rating);
      } else if (brief.accuracy <= 3.0) {
        rating = Math.min(3, rating);
      }
      
      const aiReview = await db.aIReview.create({
        data: {
          content: getRandomElement(sampleData.aiReviewContents[rating] || sampleData.aiReviewContents[4]),
          rating,
          briefId: brief.id,
          modelId: getRandomElement(createdData.reviewAIModels).id,
          requesterId: Math.random() > 0.5 ? getRandomElement(createdData.users).id : null,
          helpfulCount: getRandomInt(0, 50),
          createdAt: faker.date.between({ 
            from: brief.createdAt, 
            to: new Date() 
          }),
        },
      });
      aiReviews.push(aiReview);
    }
  }
  
  return aiReviews;
}

async function createUpvotes(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;
  const clusteringCoefficient = config.relationalPatterns?.networkEffects?.clusteringCoefficient || 0.5;
  
  // Create user clusters for network effects
  const userClusters = createUserClusters(createdData.users, clusteringCoefficient);
  
  // Brief upvotes
  for (const user of createdData.users) {
    const maxUpvotes = config.upvotes?.maxUpvotesPerUser || 50;
    const briefUpvoteCount = Math.floor(maxUpvotes * (config.upvotes?.briefUpvoteRatio || 0.6));
    
    // Get briefs to upvote based on network effects
    let candidateBriefs = [...createdData.briefs];
    
    // Users in same cluster more likely to upvote each other's content
    const userCluster = userClusters.find(cluster => cluster.includes(user));
    if (userCluster && Math.random() < clusteringCoefficient) {
      const clusterBriefs = candidateBriefs.filter(b => 
        userCluster.some(u => u.id === b.userId)
      );
      if (clusterBriefs.length > 0) {
        candidateBriefs = clusterBriefs;
      }
    }
    
    // Apply interaction density
    const actualUpvoteCount = Math.floor(briefUpvoteCount * interactionDensity);
    const selectedBriefs = getRandomElements(candidateBriefs, actualUpvoteCount);
    
    for (const brief of selectedBriefs) {
      // Viral briefs more likely to get upvotes
      if (!createdData.viralBriefs.includes(brief) && Math.random() > 0.7) continue;
      
      await db.briefUpvote.create({
        data: {
          briefId: brief.id,
          userId: user.id,
          createdAt: faker.date.between({ 
            from: brief.createdAt, 
            to: new Date() 
          }),
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }
  
  // Review upvotes with similar logic
  for (const user of createdData.users) {
    const maxUpvotes = config.upvotes?.maxUpvotesPerUser || 50;
    const reviewUpvoteCount = Math.floor(maxUpvotes * (config.upvotes?.reviewUpvoteRatio || 0.4));
    const actualUpvoteCount = Math.floor(reviewUpvoteCount * interactionDensity);
    const selectedReviews = getRandomElements(createdData.reviews, actualUpvoteCount);
    
    for (const review of selectedReviews) {
      await db.reviewUpvote.create({
        data: {
          reviewId: review.id,
          userId: user.id,
          createdAt: faker.date.between({ 
            from: review.createdAt, 
            to: new Date() 
          }),
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }
}

async function createSavedBriefs(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;
  
  for (const user of createdData.users) {
    if (Math.random() < (config.savedBriefs?.saveRatio || 0.3)) {
      const maxSaves = config.savedBriefs?.maxSavesPerUser || 30;
      const saveCount = Math.floor(getRandomInt(1, maxSaves) * interactionDensity);
      
      // Power users save more
      const isPowerUser = createdData.powerUsers.includes(user);
      const actualSaveCount = isPowerUser ? Math.floor(saveCount * 1.5) : saveCount;
      
      const selectedBriefs = getRandomElements(createdData.briefs, actualSaveCount);
      
      for (const brief of selectedBriefs) {
        // Quality bias - better briefs more likely to be saved
        if (brief.accuracy < 3.5 && Math.random() > 0.3) continue;
        
        await db.savedBrief.create({
          data: {
            userId: user.id,
            briefId: brief.id,
            createdAt: faker.date.between({ 
              from: brief.createdAt, 
              to: new Date() 
            }),
          },
        }).catch(() => {}); // Ignore duplicates
      }
    }
  }
}

async function createBriefViews(config: SeedConfig, createdData: any) {
  const interactionDensity = config.relationalPatterns?.networkEffects?.interactionDensity || 0.3;
  
  for (const user of createdData.users) {
    if (Math.random() < (config.briefViews?.viewRatio || 0.8)) {
      const baseViewCount = getRandomInt(5, 50);
      const viewCount = Math.floor(baseViewCount * interactionDensity);
      
      // Power users view more content
      const isPowerUser = createdData.powerUsers.includes(user);
      const actualViewCount = isPowerUser ? Math.floor(viewCount * 2) : viewCount;
      
      const selectedBriefs = getRandomElements(createdData.briefs, actualViewCount);
      
      for (const brief of selectedBriefs) {
        await db.briefView.create({
          data: {
            userId: user.id,
            briefId: brief.id,
            createdAt: faker.date.between({ 
              from: brief.createdAt, 
              to: new Date() 
            }),
          },
        }).catch(() => {}); // Ignore duplicates
        
        // Multiple views from same user if enabled
        if (config.briefViews?.multipleViewsPerUser && Math.random() < 0.3) {
          const additionalViews = getRandomInt(1, 3);
          for (let i = 0; i < additionalViews; i++) {
            await db.briefView.create({
              data: {
                userId: user.id,
                briefId: brief.id,
                createdAt: faker.date.between({ 
                  from: brief.createdAt, 
                  to: new Date() 
                }),
              },
            }).catch(() => {});
          }
        }
      }
    }
  }
}

async function createTokenData(config: SeedConfig, createdData: any) {
  const tokenPackages = [
    { name: 'Starter Pack', tokens: 100, price: 9.99 },
    { name: 'Pro Pack', tokens: 500, price: 39.99 },
    { name: 'Enterprise Pack', tokens: 2000, price: 149.99 },
  ];
  
  const economyType = config.tokens?.economyType || 'balanced';
  
  for (const user of createdData.users) {
    const isWhale = (user as any).isWhale;
    const isPowerUser = (user as any).isPowerUser;
    
    // Determine initial balance based on user type and economy
    let initialBalance: number;
    
    if (isWhale) {
      initialBalance = getRandomInt(5000, 20000);
    } else if (isPowerUser) {
      initialBalance = getRandomInt(500, 2000);
    } else {
      initialBalance = getRandomInt(...(config.tokens?.initialBalanceRange || [0, 1000]));
    }
    
    // Adjust for economy type
    switch (economyType) {
      case 'inflationary':
        initialBalance = Math.floor(initialBalance * 1.5);
        break;
      case 'deflationary':
        initialBalance = Math.floor(initialBalance * 0.5);
        break;
    }
    
    // Create token balance
    const userToken = await db.userToken.create({
      data: {
        userId: user.id,
        balance: initialBalance,
      },
    });
    
    // Create purchase history
    const shouldPurchase = isWhale || (Math.random() < (config.tokens?.purchaseRatio || 0.2));
    
    if (shouldPurchase) {
      const purchaseCount = isWhale ? getRandomInt(3, 10) : getRandomInt(1, 3);
      
      for (let i = 0; i < purchaseCount; i++) {
        const tokenPackage = isWhale 
          ? tokenPackages[tokenPackages.length - 1] // Whales buy big packages
          : getRandomElement(tokenPackages);
        
        const purchaseDate = faker.date.between({ 
          from: user.createdAt, 
          to: new Date() 
        });
        
        const purchase = await db.tokenPurchase.create({
          data: {
            userId: user.id,
            packageName: tokenPackage.name,
            tokensAmount: tokenPackage.tokens,
            priceUSD: tokenPackage.price,
            paymentMethod: getRandomElement(['stripe', 'paypal']),
            paymentId: faker.string.uuid(),
            status: 'completed',
            createdAt: purchaseDate,
          },
        });
        
        // Create corresponding transaction
        await db.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: tokenPackage.tokens,
            reason: 'Token purchase',
            purchaseId: purchase.id,
            createdAt: purchaseDate,
          },
        });
      }
    }
    
    // Create transaction history
    const baseTransactionCount = getRandomInt(...(config.tokens?.transactionCountRange || [0, 50]));
    const transactionCount = isPowerUser ? Math.floor(baseTransactionCount * 2) : baseTransactionCount;
    
    const userBriefs = createdData.briefs.filter((b: any) => b.userId === user.id);
    
    for (let i = 0; i < transactionCount; i++) {
      const transactionTypes = [
        { amount: -10, reason: 'Brief creation' },
        { amount: 5, reason: 'Review reward' },
        { amount: 2, reason: 'Upvote reward' },
        { amount: -5, reason: 'Export usage' },
        { amount: 10, reason: 'Quality content bonus' },
        { amount: -20, reason: 'Premium feature usage' },
      ];
      
      // Adjust transaction amounts for economy type
      const economyMultiplier = economyType === 'inflationary' ? 1.5 : 
                                economyType === 'deflationary' ? 0.7 : 1.0;
      
      const transaction = getRandomElement(transactionTypes);
      const adjustedAmount = Math.floor(transaction.amount * economyMultiplier);
      
      await db.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: adjustedAmount,
          reason: transaction.reason,
          briefId: transaction.reason === 'Brief creation' && userBriefs.length > 0
            ? getRandomElement(userBriefs)?.id 
            : null,
          createdAt: faker.date.between({ 
            from: user.createdAt, 
            to: new Date() 
          }),
        },
      });
    }
  }
}

async function createExportHistory(config: SeedConfig, createdData: any) {
  const exportTypes = ['brief', 'user_profile', 'search_results'];
  const formatDist = normalizeDistribution(
    config.exports?.formatDistribution || 
    { pdf: 0.4, markdown: 0.2, html: 0.15, json: 0.1, csv: 0.05, docx: 0.05, txt: 0.05 }
  );
  
  for (const user of createdData.users) {
    const isPowerUser = createdData.powerUsers.includes(user);
    const baseExportCount = getRandomInt(...(config.exports?.exportsPerUser || [0, 10]));
    const exportCount = isPowerUser ? Math.floor(baseExportCount * 2) : baseExportCount;
    
    for (let i = 0; i < exportCount; i++) {
      const exportType = getRandomElement(exportTypes);
      const exportFormat = getWeightedRandom(formatDist);
      
      const exportDate = faker.date.between({ 
        from: user.createdAt, 
        to: new Date() 
      });
      
      let targetId: string;
      if (exportType === 'brief' && createdData.briefs.length > 0) {
        targetId = getRandomElement(createdData.briefs).id;
      } else {
        targetId = user.id;
      }
      
      await db.exportHistory.create({
        data: {
          userId: user.id,
          exportType,
          exportFormat: exportFormat as string,
          targetId,
          filename: `export_${faker.string.alphanumeric(8)}.${exportFormat}`,
          fileSize: getRandomInt(1000, 5000000),
          status: 'completed',
          downloadCount: getRandomInt(1, 5),
          createdAt: exportDate,
        },
      });
      
      // Update or create export usage for rate limiting
      const dateOnly = new Date(exportDate);
      dateOnly.setHours(0, 0, 0, 0);
      
      await db.exportUsage.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: dateOnly,
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          userId: user.id,
          date: dateOnly,
          count: 1,
        },
      });
    }
  }
}

// Helper functions for relational patterns
function createUserClusters(users: any[], clusteringCoefficient: number): any[][] {
  const clusterCount = Math.max(1, Math.floor(users.length * 0.1));
  const clusters: any[][] = [];
  const clusteredUsers = new Set<string>();
  
  // Create clusters
  for (let i = 0; i < clusterCount; i++) {
    const clusterSize = Math.floor(users.length * clusteringCoefficient / clusterCount);
    const cluster: any[] = [];
    
    // Pick a seed user
    const availableUsers = users.filter(u => !clusteredUsers.has(u.id));
    if (availableUsers.length === 0) break;
    
    const seedUser = getRandomElement(availableUsers);
    cluster.push(seedUser);
    clusteredUsers.add(seedUser.id);
    
    // Add nearby users
    for (let j = 1; j < clusterSize; j++) {
      const available = users.filter(u => !clusteredUsers.has(u.id));
      if (available.length === 0) break;
      
      const user = getRandomElement(available);
      cluster.push(user);
      clusteredUsers.add(user.id);
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

function getEngagementMultiplier(pattern: string, progress: number): number {
  switch (pattern) {
    case 'viral':
      // Sudden spikes
      if (Math.random() < 0.1) return getRandomFloat(5, 10);
      return 1;
      
    case 'steady':
      // Consistent engagement
      return getRandomFloat(0.8, 1.2);
      
    case 'declining':
      // Decreasing over time
      return Math.max(0.1, 1 - progress * 0.8);
      
    case 'organic':
    default:
      // Natural variation
      return getRandomFloat(0.5, 2);
  }
}

function getTemporalDate(config: SeedConfig, userCreatedAt: Date, index: number, total: number): Date {
  const clustering = config.relationalPatterns?.temporalClustering || 'none';
  const baseDate = getSkewedDate(config);
  
  // Ensure content is created after user joined
  const earliestDate = Math.max(userCreatedAt.getTime(), baseDate.getTime());
  
  switch (clustering) {
    case 'weekly':
      // Cluster around weekly intervals
      const weekNumber = Math.floor(index / (total / 52));
      const weekStart = new Date(earliestDate);
      weekStart.setDate(weekStart.getDate() + weekNumber * 7);
      return faker.date.between({ 
        from: weekStart, 
        to: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) 
      });
      
    case 'monthly':
      // Cluster around monthly intervals
      const monthNumber = Math.floor(index / (total / 12));
      const monthStart = new Date(earliestDate);
      monthStart.setMonth(monthStart.getMonth() + monthNumber);
      return faker.date.between({ 
        from: monthStart, 
        to: new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000) 
      });
      
    case 'events':
      // Cluster around specific events (simulate product launches, etc.)
      const events = [0.1, 0.3, 0.5, 0.7, 0.9]; // Event points in timeline
      const nearestEvent = events.reduce((prev, curr) => 
        Math.abs(curr - index/total) < Math.abs(prev - index/total) ? curr : prev
      );
      const eventTime = earliestDate + (Date.now() - earliestDate) * nearestEvent;
      const variance = 7 * 24 * 60 * 60 * 1000; // 7 days variance
      return new Date(eventTime + (Math.random() - 0.5) * variance);
      
    case 'none':
    default:
      return new Date(earliestDate);
  }
}

// Console command handler
export async function seedFromConsole(args: string[]) {
  const config: SeedConfig = { ...DEFAULT_CONFIG };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--no-delete':
        config.deleteAll = false;
        break;
      case '--users':
        config.users!.count = parseInt(args[++i]);
        break;
      case '--briefs':
        config.briefs!.count = parseInt(args[++i]);
        break;
      case '--sources':
        config.sources!.count = parseInt(args[++i]);
        break;
      case '--power-users':
        config.dataSkew!.powerUsers = true;
        break;
      case '--viral':
        config.dataSkew!.viralBriefs = true;
        break;
      case '--help':
        console.log(`
Seed Database Command Options:
  --no-delete         Don't delete existing data
  --users <count>     Number of users to create
  --briefs <count>    Number of briefs to create
  --sources <count>   Number of sources to create
  --power-users       Create power users with more activity
  --viral             Create viral briefs with high engagement
  --help              Show this help message

Examples:
  npm run db:seed --users 100 --briefs 500
  npm run db:seed --no-delete --users 50
  npm run db:seed --power-users --viral
        `);
        return;
    }
  }
  
  return seed(config);
}

// Export configuration validation
export async function validateSeedConfig(config: any): { valid: boolean; errors: string[] } {
  return validateConfig(config as SeedConfig);
}

// Export configuration template
export async function getConfigTemplate(): SeedConfig {
  return { ...DEFAULT_CONFIG };
}