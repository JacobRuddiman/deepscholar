import { db } from '@/server/db';
import { isLocalMode } from './localMode';

// Database transaction wrapper with proper error handling
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      return await operation(tx);
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Transaction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed'
    };
  }
}

// Atomic token operations to prevent race conditions
export async function atomicTokenOperation(
  userId: string,
  operation: 'deduct' | 'award',
  amount: number,
  reason: string,
  briefId?: string,
  reviewId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  return withTransaction(async (tx) => {
    // Get current balance
    const userToken = await tx.userToken.findUnique({
      where: { userId },
    });

    const currentBalance = userToken?.balance ?? 0;

    // For deduct operations, check if sufficient balance
    if (operation === 'deduct' && currentBalance < amount) {
      throw new Error('Insufficient tokens');
    }

    // Calculate new balance
    const newBalance = operation === 'deduct' 
      ? currentBalance - amount 
      : currentBalance + amount;

    // Update balance atomically
    const updatedToken = await tx.userToken.upsert({
      where: { userId },
      update: { balance: newBalance },
      create: { userId, balance: newBalance },
    });

    // Create transaction record
    await tx.tokenTransaction.create({
      data: {
        userId,
        amount: operation === 'deduct' ? -amount : amount,
        reason,
        briefId,
        reviewId,
      },
    });

    return updatedToken.balance;
  });
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    
    // Simple query to test connection
    await db.user.findFirst({
      select: { id: true },
    });
    
    const latency = Date.now() - start;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// Connection cleanup for graceful shutdown
export async function cleanupDatabase(): Promise<void> {
  try {
    await db.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Query performance monitoring (development only)
export function monitorQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return queryFn();
  }

  return new Promise<T>((resolve, reject) => {
    const start = Date.now();
    
    queryFn()
      .then((result) => {
        const duration = Date.now() - start;
        
        if (duration > 1000) {
          console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
        } else if (duration > 500) {
          console.log(`Query ${queryName} took ${duration}ms`);
        }
        
        resolve(result);
      })
      .catch((error) => {
        const duration = Date.now() - start;
        console.error(`Query ${queryName} failed after ${duration}ms:`, error);
        reject(error);
      });
  });
}

// Local mode specific optimizations
export const localModeOptimizations = {
  // Seed database with test data for local development
  seedTestData: async () => {
    if (!isLocalMode()) {
      throw new Error('Test data seeding is only available in local mode');
    }

    return withTransaction(async (tx) => {
      // Create test categories
      const categories = await Promise.all([
        tx.category.upsert({
          where: { name: 'Computer Science' },
          update: {},
          create: { name: 'Computer Science', description: 'Computing and technology research' },
        }),
        tx.category.upsert({
          where: { name: 'AI & Machine Learning' },
          update: {},
          create: { name: 'AI & Machine Learning', description: 'Artificial intelligence research' },
        }),
        tx.category.upsert({
          where: { name: 'Climate Science' },
          update: {},
          create: { name: 'Climate Science', description: 'Environmental and climate research' },
        }),
      ]);

      // Create test models
      const models = await Promise.all([
        tx.researchAIModel.upsert({
          where: { name_version_provider: { name: 'GPT-4', version: '4.0', provider: 'OpenAI' } },
          update: {},
          create: { name: 'GPT-4', version: '4.0', provider: 'OpenAI' },
        }),
        tx.researchAIModel.upsert({
          where: { name_version_provider: { name: 'Claude', version: '3.5', provider: 'Anthropic' } },
          update: {},
          create: { name: 'Claude', version: '3.5', provider: 'Anthropic' },
        }),
      ]);

      return { categories, models };
    });
  },

  // Clear all test data
  clearTestData: async () => {
    if (!isLocalMode()) {
      throw new Error('Test data clearing is only available in local mode');
    }

    return withTransaction(async (tx) => {
      // Delete in correct order to respect foreign key constraints
      await tx.reviewHelpful.deleteMany();
      await tx.reviewUpvote.deleteMany();
      await tx.review.deleteMany();
      await tx.aIReview.deleteMany();
      await tx.briefUpvote.deleteMany();
      await tx.savedBrief.deleteMany();
      await tx.briefView.deleteMany();
      await tx.tokenTransaction.deleteMany();
      await tx.brief.deleteMany();
      await tx.userToken.deleteMany();
      await tx.category.deleteMany();
      await tx.researchAIModel.deleteMany();
      await tx.source.deleteMany();
      
      console.log('All test data cleared');
    });
  },
};

// Optimized query helpers
export const queryHelpers = {
  // Get briefs with minimal data for listing
  getBriefsForListing: async (limit = 10, offset = 0) => {
    return monitorQuery('getBriefsForListing', () =>
      db.brief.findMany({
        select: {
          id: true,
          title: true,
          abstract: true,
          slug: true,
          viewCount: true,
          createdAt: true,
          categories: {
            select: {
              name: true,
            },
          },
          model: {
            select: {
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    );
  },

  // Get user stats efficiently
  getUserStats: async (userId: string) => {
    return monitorQuery('getUserStats', () =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              briefs: true,
              reviews: true,
              briefUpvotes: true,
            },
          },
          tokenBalance: {
            select: {
              balance: true,
            },
          },
        },
      })
    );
  },
};

export default {
  withTransaction,
  atomicTokenOperation,
  checkDatabaseHealth,
  cleanupDatabase,
  monitorQuery,
  localModeOptimizations,
  queryHelpers,
};
