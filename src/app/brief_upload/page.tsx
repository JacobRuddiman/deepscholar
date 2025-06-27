"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BriefUploadEditor from "../components/BriefUploadEditor";
import type { BriefData } from '@/functions/types';
import { createBrief } from "@/server/actions/briefs";
import { getDefaultModel } from "@/server/actions/models";
import ErrorPopup from "../components/error_popup";
import { useDeviceDetection } from "../hooks/useDeviceDetection";

export default function BriefUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);
  const { isMobile } = useDeviceDetection();

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
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Get model ID
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
        setDefaultModelId(modelId);
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

  return (
    <div className={`${isMobile ? 'px-2 py-4' : 'px-4 py-8'} overflow-x-hidden`}>
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
      />
      
      <BriefUploadEditor 
        onSubmit={handleSubmit}
      />
    </div>
  );
}