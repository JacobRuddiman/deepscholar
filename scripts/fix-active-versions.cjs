const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixActiveVersions() {
  console.log('🔧 Fixing active versions...');

  try {
    // Get all briefs grouped by their root brief
    const allBriefs = await prisma.brief.findMany({
      select: {
        id: true,
        parentBriefId: true,
        versionNumber: true,
        isDraft: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group briefs by their root brief ID
    const briefFamilies = new Map();
    
    for (const brief of allBriefs) {
      const rootId = brief.parentBriefId || brief.id;
      
      if (!briefFamilies.has(rootId)) {
        briefFamilies.set(rootId, []);
      }
      briefFamilies.get(rootId).push(brief);
    }

    console.log(`📊 Found ${briefFamilies.size} brief families`);

    let fixedFamilies = 0;

    // Process each brief family
    for (const [rootId, briefs] of briefFamilies) {
      // Filter out drafts - only published versions can be active
      const publishedVersions = briefs.filter(b => !b.isDraft);
      
      if (publishedVersions.length === 0) {
        console.log(`⚠️  Brief family ${rootId} has no published versions, skipping`);
        continue;
      }

      // Check if any published version is active
      const activeVersions = publishedVersions.filter(b => b.isActive);
      
      if (activeVersions.length === 0) {
        // No active version - set the first published version as active
        const firstVersion = publishedVersions[0];
        
        await prisma.brief.update({
          where: { id: firstVersion.id },
          data: { isActive: true },
        });
        
        console.log(`✅ Set brief ${firstVersion.id} as active (first version in family ${rootId})`);
        fixedFamilies++;
      } else if (activeVersions.length > 1) {
        // Multiple active versions - keep only the first one active
        for (let i = 1; i < activeVersions.length; i++) {
          await prisma.brief.update({
            where: { id: activeVersions[i].id },
            data: { isActive: false },
          });
        }
        
        console.log(`✅ Fixed multiple active versions in family ${rootId}, kept ${activeVersions[0].id} active`);
        fixedFamilies++;
      }
      // If exactly one active version, no action needed
    }

    console.log(`🎉 Fixed ${fixedFamilies} brief families`);
    console.log('✅ Active version fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing active versions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixActiveVersions()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
