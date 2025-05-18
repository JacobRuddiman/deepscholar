'use server';

import { prisma } from "@/lib/prisma";

export async function getDefaultModel(provider: string = "OpenAI") {
  console.log('=== getDefaultModel START ===');
  console.log('Input provider:', provider);
  
  try {
    // Normalize the provider name to lowercase
    const normalizedProvider = provider.toLowerCase();
    console.log('Normalized provider:', normalizedProvider);
    
    console.log('Looking for model with provider:', normalizedProvider);

    const model = await prisma.researchAIModel.findFirst({
      where: {
        provider: {
          equals: normalizedProvider,
          mode: 'insensitive'
        }
      }
    });

    if (!model) {
      console.error('No model found for provider:', normalizedProvider);
      return { 
        success: false, 
        error: `No model found for provider "${provider}". Please ensure a model exists for this provider.` 
      };
    }

    console.log('Model found:', {
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });

    console.log('=== getDefaultModel SUCCESS ===');
    return { success: true, data: model };
  } catch (error: any) {
    console.error('=== getDefaultModel ERROR ===');
    console.error('Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    return { success: false, error: 'Failed to get model' };
  }
} 