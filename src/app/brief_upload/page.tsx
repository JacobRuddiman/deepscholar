// brief_upload/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BriefUploadEditor from "../components/BriefUploadEditor";
import type { BriefData } from '@/functions/types';
import { createBrief } from "@/server/actions/briefs";
import { getDefaultModel } from "@/server/actions/models";
import ErrorPopup from "../components/error_popup";

export default function BriefUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);
  
  // New state for input mode
  const [inputMode, setInputMode] = useState<'url' | 'content'>('url');
  const [pastedContent, setPastedContent] = useState('');

  console.log('=== BriefUploadPage Render ===');
  console.log('Session status:', status);
  console.log('Session data:', session);
  console.log('Current state:', {
    error,
    isSubmitting,
    defaultModelId
  });

  const initializeModel = async (provider: string) => {
    console.log('=== initializeModel START ===');
    console.log('Input provider:', provider);
    
    try {
      const result = await getDefaultModel(provider);
      console.log('getDefaultModel result:', JSON.stringify(result, null, 2));
      
      if (!result.success || !result.data) {
        console.error('Model initialization failed:', result.error);
        throw new Error(result.error ?? 'Failed to get model');
      }
      
      console.log('Setting defaultModelId to:', result.data.id);
      setDefaultModelId(result.data.id);
      console.log('=== initializeModel SUCCESS ===');
    } catch (err: unknown) {
      console.error('=== initializeModel ERROR ===');
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      setError('Failed to initialize model. Please try again.');
    }
  };
  
  const handleSubmit = async (briefData: BriefData) => {
    console.log('=== handleSubmit START ===');
    console.log('=== FULL BRIEF DATA ===');
    console.log(JSON.stringify({
      title: briefData.title,
      content: briefData.content,
      abstract: briefData.abstract,
      sources: briefData.sources.map(source => ({
        title: source.title,
        url: source.url,
        author: source.author ?? 'not provided',
        date: source.date ?? 'not provided'
      })),
      thinking: briefData.thinking,
      model: briefData.model,
      rawHtml: briefData.rawHtml ? 'present' : 'missing',
      references: briefData.references ? 'present' : 'missing'
    }, null, 2));
    console.log('=== BRIEF DATA SUMMARY ===');
    console.log(JSON.stringify({
      title: briefData.title,
      provider: briefData.model,
      contentLength: briefData.content.length,
      abstractLength: briefData.abstract.length,
      thinkingLength: briefData.thinking.length,
      sourcesCount: briefData.sources.length,
      rawHtml: briefData.rawHtml ? 'present' : 'missing',
      references: briefData.references ? 'present' : 'missing'
    }, null, 2));
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Get model ID - either use cached one or fetch fresh
      let modelId = defaultModelId;
      if (!modelId) {
        console.log('No defaultModelId found, fetching model...');
        const result = await getDefaultModel(briefData.model);
        console.log('getDefaultModel result:', JSON.stringify(result, null, 2));
        
        if (!result.success || !result.data) {
          console.error('Model initialization failed:', result.error);
          throw new Error(result.error ?? 'Failed to get model');
        }
        
        modelId = result.data.id;
        setDefaultModelId(modelId); // Update state for future use
        console.log('Using fresh modelId:', modelId);
      } else {
        console.log('Using cached defaultModelId:', defaultModelId);
      }
      
      if (!modelId) {
        console.error('Model initialization failed - no modelId available');
        throw new Error('Model not initialized. Please try again.');
      }
      
      // Transform BriefData into the format expected by createBrief
      const createBriefInput = {
        title: briefData.title,
        abstract: briefData.abstract,
        prompt: briefData.thinking,
        response: briefData.content,
        thinking: briefData.thinking,
        modelId: modelId,
        categoryIds: [],
        sourceIds: [],
      };
      
      console.log('=== CREATE BRIEF INPUT ===');
      console.log(JSON.stringify({
        ...createBriefInput,
        contentLength: createBriefInput.response.length,
        abstractLength: createBriefInput.abstract.length,
        thinkingLength: createBriefInput.thinking.length,
        modelId: createBriefInput.modelId
      }, null, 2));
      
      const result = await createBrief(createBriefInput);
      console.log('=== CREATE BRIEF RESULT ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (!result.success) {
        console.error('Brief creation failed:', result.error);
        throw new Error(result.error ?? 'Failed to create brief');
      }

      // ROUTING ENHANCEMENT: Use ID-based routing instead of slug-based
      // Since we've moved to ID-based routing system, we should redirect using the brief ID
      // This prevents issues when slug is null or empty, and ensures consistent routing
      // The routing system will handle both slug and ID URLs automatically
      // This relates to the createBrief function changes that make slug optional
      if (!result.data?.id) {
        console.error('Brief creation succeeded but no ID returned');
        throw new Error('Failed to create brief: No ID returned');
      }

      console.log('Brief created successfully, redirecting to:', `/briefs/${result.data.id}`);
      router.push(`/briefs/${result.data.id}`);
      console.log('=== handleSubmit SUCCESS ===');
    } catch (err: unknown) {
      console.error('=== handleSubmit ERROR ===');
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      setError(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setIsSubmitting(false);
      console.log('=== handleSubmit END ===');
    }
  };
  
  // Handle content paste and fetch
  const handleFetchFromContent = async () => {
    if (!pastedContent.trim()) {
      setError('Please paste some content first');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // For now, create a basic brief from the pasted content
      // In the future, this could be enhanced to parse the content more intelligently
      const briefData: BriefData = {
        title: 'Pasted Content Brief',
        content: pastedContent,
        abstract: pastedContent.substring(0, 200) + '...',
        thinking: '',
        model: 'other' as const,
        sources: [],
        references: ''
      };

      await handleSubmit(briefData);
    } catch (err: unknown) {
      console.error('Error processing pasted content:', err);
      setError(err instanceof Error ? err.message : 'Failed to process content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
      />
      
      {/* Content Paste Option */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Paste Your Content</h2>
          <textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste your research content, article, or any text you want to create a brief from..."
            className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {pastedContent.length} characters
            </span>
            <button
              onClick={handleFetchFromContent}
              disabled={!pastedContent.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Create Brief'}
            </button>
          </div>
        </div>
      </div>

      <BriefUploadEditor 
        onSubmit={handleSubmit}
      />
    </div>
  );
}
