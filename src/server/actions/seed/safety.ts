import { db } from "@/server/db";
import { SeedConfig, DatabaseSafetyCheck } from './config';

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
  const nonSeedData: { type: string; count: number; examples: string[] }[] = [];
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