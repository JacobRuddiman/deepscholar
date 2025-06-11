'use server';

import { db } from "@/server/db";

export async function getDefaultModel(provider = "OpenAI") {
  console.log('\n🔍 ===== DETAILED MODEL LOOKUP DEBUG =====');
  console.log('📋 Input provider:', provider);
  console.log('📋 Provider type:', typeof provider);
  console.log('📋 Provider length:', provider.length);
  console.log('📋 Provider char codes:', Array.from(provider).map(c => c.charCodeAt(0)));
  
  try {
    // Check environment
    console.log('\n🌍 ENVIRONMENT CHECK:');
    console.log('- LOCAL_MODE env var:', process.env.NEXT_PUBLIC_LOCAL_MODE);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    // Normalize the provider name to lowercase to match database
    const normalizedProvider = provider.toLowerCase();
    console.log('\n🔄 NORMALIZATION:');
    console.log('- Original provider:', JSON.stringify(provider));
    console.log('- Normalized provider:', JSON.stringify(normalizedProvider));
    console.log('- Normalized type:', typeof normalizedProvider);
    console.log('- Normalized length:', normalizedProvider.length);
    
    console.log('\n🗄️ DATABASE QUERY ATTEMPT:');
    console.log('- Using db service from:', '@/server/db');
    console.log('- Query: db.researchAIModel.findFirst({ where: { provider:', JSON.stringify(normalizedProvider), '}})');
    
    // First, let's see what models exist in the database
    console.log('\n📊 CHECKING ALL MODELS IN DATABASE:');
    const allModels = await db.researchAIModel.findMany();
    console.log('- Total models found:', allModels.length);
    allModels.forEach((model, index) => {
      console.log(`  Model ${index + 1}:`, {
        id: model.id,
        name: model.name,
        provider: JSON.stringify(model.provider),
        providerType: typeof model.provider,
        providerLength: model.provider.length,
        version: model.version,
        createdAt: model.createdAt
      });
    });
    
    // Check for exact matches
    console.log('\n🔍 PROVIDER MATCHING ANALYSIS:');
    const exactMatches = allModels.filter(m => m.provider === normalizedProvider);
    console.log('- Exact matches for', JSON.stringify(normalizedProvider), ':', exactMatches.length);
    
    const caseInsensitiveMatches = allModels.filter(m => m.provider.toLowerCase() === normalizedProvider);
    console.log('- Case-insensitive matches:', caseInsensitiveMatches.length);
    
    // Try different variations
    const variations = [
      provider,
      provider.toLowerCase(),
      provider.toUpperCase(),
      'openai',
      'OpenAI',
      'OPENAI'
    ];
    
    console.log('\n🔄 TESTING VARIATIONS:');
    for (const variation of variations) {
      const matches = allModels.filter(m => m.provider === variation);
      console.log(`- "${variation}" matches:`, matches.length);
      if (matches.length > 0) {
        console.log('  Found:', matches[0]);
      }
    }

    console.log('\n🎯 EXECUTING MAIN QUERY:');
    const model = await db.researchAIModel.findFirst({
      where: {
        provider: normalizedProvider
      }
    });
    
    console.log('- Query result:', model ? 'FOUND' : 'NOT FOUND');
    if (model) {
      console.log('- Found model:', {
        id: model.id,
        name: model.name,
        provider: model.provider,
        version: model.version
      });
    }

    if (!model) {
      console.error('\n❌ NO MODEL FOUND!');
      console.error('- Searched for provider:', JSON.stringify(normalizedProvider));
      console.error('- Available providers:', allModels.map(m => JSON.stringify(m.provider)));
      
      // Try to find the closest match
      const possibleMatch = allModels.find(m => 
        m.provider.toLowerCase().includes('openai') || 
        m.name.toLowerCase().includes('gpt')
      );
      
      if (possibleMatch) {
        console.error('- Possible match found:', possibleMatch);
        console.error('- Consider using provider:', JSON.stringify(possibleMatch.provider));
      }
      
      return { 
        success: false, 
        error: `No model found for provider "${provider}". Available providers: ${allModels.map(m => m.provider).join(', ')}` 
      };
    }

    console.log('\n✅ SUCCESS! Model found:', {
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });

    console.log('🔍 ===== MODEL LOOKUP DEBUG END =====\n');
    return { success: true, data: model };
  } catch (error: unknown) {
    console.error('\n💥 ===== CRITICAL ERROR IN MODEL LOOKUP =====');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    console.error('🔍 ===== MODEL LOOKUP DEBUG END =====\n');
    return { success: false, error: 'Failed to get model' };
  }
}
