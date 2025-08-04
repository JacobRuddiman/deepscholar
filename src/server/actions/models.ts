'use server';

import { db } from "@/server/db";

export async function getDefaultModel(provider = "OpenAI") {
  console.log('\n🔍 ===== DETAILED MODEL LOOKUP DEBUG =====');
  console.log('📋 Input provider:', provider);
  
  try {
    // Create a mapping of common variations to the actual database values
    const providerMapping: { [key: string]: string } = {
      'openai': 'OpenAI',
      'OpenAI': 'OpenAI',
      'OPENAI': 'OpenAI',
      'anthropic': 'Anthropic',
      'Anthropic': 'Anthropic',
      'ANTHROPIC': 'Anthropic'
    };
    
    const mappedProvider = providerMapping[provider] || provider;
    console.log('🔄 Mapped provider:', mappedProvider);
    
    const model = await db.researchAIModel.findFirst({
      where: {
        provider: mappedProvider
      }
    });
    
    if (!model) {
      console.error('\n❌ NO MODEL FOUND!');
      console.error('- Searched for provider:', mappedProvider);
      
      // Get all available providers for error message
      const allModels = await db.researchAIModel.findMany({
        select: { provider: true }
      });
      const availableProviders = [...new Set(allModels.map(m => m.provider))];
      
      return { 
        success: false, 
        error: `No model found for provider "${provider}". Available providers: ${availableProviders.join(', ')}` 
      };
    }

    console.log('✅ SUCCESS! Model found:', {
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version
    });

    return { success: true, data: model };
  } catch (error: unknown) {
    console.error('\n💥 ===== CRITICAL ERROR IN MODEL LOOKUP =====');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return { success: false, error: 'Failed to get model' };
  }
}