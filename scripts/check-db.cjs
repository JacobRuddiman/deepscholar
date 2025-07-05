const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database contents...');
    
    // Check briefs
    const briefCount = await prisma.brief.count();
    console.log(`Total briefs: ${briefCount}`);
    
    const activeBriefs = await prisma.brief.count({
      where: {
        isActive: true,
        isDraft: false,
        published: true
      }
    });
    console.log(`Active published briefs: ${activeBriefs}`);
    
    // Get some sample briefs
    const sampleBriefs = await prisma.brief.findMany({
      where: {
        isActive: true,
        isDraft: false,
        published: true
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        model: {
          select: {
            name: true
          }
        },
        categories: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });
    
    console.log('\nSample briefs:');
    sampleBriefs.forEach((brief, index) => {
      console.log(`${index + 1}. "${brief.title}"`);
      console.log(`   Abstract: ${brief.abstract?.substring(0, 100)}...`);
      console.log(`   Model: ${brief.model?.name || 'Unknown'}`);
      console.log(`   Categories: ${brief.categories.map(c => c.name).join(', ')}`);
      console.log('');
    });
    
    // Check models
    const modelCount = await prisma.researchAIModel.count();
    console.log(`Total models: ${modelCount}`);
    
    const models = await prisma.researchAIModel.findMany({
      select: {
        name: true,
        provider: true
      }
    });
    console.log('Available models:', models.map(m => `${m.name} (${m.provider})`).join(', '));
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
