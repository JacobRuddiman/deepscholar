// brief_upload/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BriefEditor from "../components/bried_editor";
import type { BriefData } from '@/functions/types';
import { createBrief } from "@/server/actions/briefs";
import { getDefaultModel } from "@/server/actions/models";
import { AlertCircle } from "lucide-react";
import { slugify } from "@/lib/utils";

export default function BriefUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null);

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
        throw new Error(result.error || 'Failed to get model');
      }
      
      console.log('Setting defaultModelId to:', result.data.id);
      setDefaultModelId(result.data.id);
      console.log('=== initializeModel SUCCESS ===');
    } catch (err: any) {
      console.error('=== initializeModel ERROR ===');
      console.error('Error details:', {
        name: err?.name || 'Unknown',
        message: err?.message || 'Unknown error',
        stack: err?.stack || 'No stack trace'
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
        author: source.author || 'not provided',
        date: source.date || 'not provided'
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

      // Initialize model if not already done
      if (!defaultModelId) {
        console.log('No defaultModelId found, initializing model...');
        await initializeModel(briefData.model);
      } else {
        console.log('Using existing defaultModelId:', defaultModelId);
      }
      
      if (!defaultModelId) {
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
        modelId: defaultModelId,
        slug: slugify(briefData.title),
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
        throw new Error(result.error || 'Failed to create brief');
      }

      if (!result.data?.slug) {
        console.error('Brief creation succeeded but no slug returned');
        throw new Error('Failed to create brief: No slug returned');
      }

      console.log('Brief created successfully, redirecting to:', `/briefs/${result.data.slug}`);
      router.push(`/briefs/${result.data.slug}`);
      console.log('=== handleSubmit SUCCESS ===');
    } catch (err: any) {
      console.error('=== handleSubmit ERROR ===');
      console.error('Error details:', {
        name: err?.name || 'Unknown',
        message: err?.message || 'Unknown error',
        stack: err?.stack || 'No stack trace'
      });
      setError(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setIsSubmitting(false);
      console.log('=== handleSubmit END ===');
    }
  };
  
  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
      <BriefEditor onSubmit={handleSubmit} />
    </div>
  );
}