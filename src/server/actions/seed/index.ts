'use server';

import { db } from "@/server/db";
import { SeedConfig, DEFAULT_CONFIG } from './config';
import { validateConfig, ProgressTracker } from './utils';
import { verifyDatabaseSafety, trackSeedingMetadata } from './safety';
import { deleteAllData, deleteTableData } from './cleanup';
import { 
  createUsers, 
  createResearchAIModels, 
  createReviewAIModels, 
  createCategories, 
  createSources 
} from './creators/basic';
import { 
  createBriefs, 
  createReviews, 
  createAIReviews, 
  createUpvotes, 
  createSavedBriefs, 
  createBriefViews, 
  createTokenData, 
  createExportHistory 
} from './creators/advanced';

// Re-export types and functions
export { SeedConfig, DatabaseSafetyCheck } from './config';
export { verifyDatabaseSafety, trackSeedingMetadata } from './safety';

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

  // Safety check (unless forced)
  if ((config.deleteAll || config.deleteTables?.length) && !config.force) {
    console.log('🔍 Performing database safety check...');
    const safetyCheck = await verifyDatabaseSafety();
    
    if (!safetyCheck.isSafe) {
      return {
        success: false,
        error: 'Database safety check failed - non-seed data detected',
        safetyCheck,
      };
    }
  } else if (config.force) {
    console.log('⚠️ Force flag detected - skipping safety check');
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

    // Create basic entities
    if (config.users?.enabled) {
      progress.report(`👤 Creating ${config.users.count} users...`);
      createdData.users = await createUsers(config, createdData);
      progress.increment(`✅ Created ${createdData.users.length} users`);
    }

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

    if (config.categories?.enabled) {
      progress.report('📁 Creating categories...');
      createdData.categories = await createCategories(config);
      progress.increment(`✅ Created ${createdData.categories.length} categories`);
    }

    if (config.sources?.enabled) {
      progress.report(`🔗 Creating ${config.sources.count} sources...`);
      createdData.sources = await createSources(config);
      progress.increment(`✅ Created ${createdData.sources.length} sources`);
    }

    // Create complex entities
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

    if (config.reviews?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping reviews: requires users and briefs');
      } else {
        progress.report('⭐ Creating user reviews...');
        createdData.reviews = await createReviews(config, createdData);
        progress.increment(`✅ Created ${createdData.reviews.length} reviews`);
      }
    }

    if (config.aiReviews?.enabled) {
      if (createdData.briefs.length === 0 || createdData.reviewAIModels.length === 0) {
        console.warn('⚠️ Skipping AI reviews: requires briefs and review AI models');
      } else {
        progress.report('🤖 Creating AI reviews...');
        createdData.aiReviews = await createAIReviews(config, createdData);
        progress.increment(`✅ Created ${createdData.aiReviews.length} AI reviews`);
      }
    }

    // Create engagement data
    if (config.upvotes?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping upvotes: requires users and briefs');
      } else {
        progress.report('👍 Creating upvotes...');
        await createUpvotes(config, createdData);
        progress.increment('✅ Upvotes created');
      }
    }

    if (config.savedBriefs?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping saved briefs: requires users and briefs');
      } else {
        progress.report('💾 Creating saved briefs...');
        await createSavedBriefs(config, createdData);
        progress.increment('✅ Saved briefs created');
      }
    }

    if (config.briefViews?.enabled) {
      if (createdData.users.length === 0 || createdData.briefs.length === 0) {
        console.warn('⚠️ Skipping brief views: requires users and briefs');
      } else {
        progress.report('👁️ Creating brief views...');
        await createBriefViews(config, createdData);
        progress.increment('✅ Brief views created');
      }
    }

    if (config.tokens?.enabled) {
      if (createdData.users.length === 0) {
        console.warn('⚠️ Skipping token data: requires users');
      } else {
        progress.report('💰 Creating token balances and transactions...');
        await createTokenData(config, createdData);
        progress.increment('✅ Token data created');
      }
    }

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
      case '--force':
        config.force = true;
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
  --force             Force seeding even if non-seed data exists
  --users <count>     Number of users to create
  --briefs <count>    Number of briefs to create
  --sources <count>   Number of sources to create
  --power-users       Create power users with more activity
  --viral             Create viral briefs with high engagement
  --help              Show this help message

Examples:
  npm run db:seed --users 100 --briefs 500
  npm run db:seed --no-delete --users 50
  npm run db:seed --force --power-users --viral
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