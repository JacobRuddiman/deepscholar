"use client";

import React, { useState } from "react";
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
  
  // brief_upload/page.tsx
const handleSubmit = async (briefData: BriefData) => {
  console.log('=== handleSubmit START ===');
  
  try {
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!briefData.title?.trim()) {
      throw new Error("Title is required");
    }
    if (!briefData.content?.trim()) {
      throw new Error("Content is required");
    }

    // Get model ID
    let modelId = defaultModelId;
    if (!modelId) {
      console.log('No defaultModelId found, fetching model...');
      const result = await getDefaultModel(briefData.model);
      
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to get model');
      }
      
      modelId = result.data.id;
      setDefaultModelId(modelId);
    }
    
    // Import debug functions for testing
    const { testDatabaseConnection, ensureLocalUser, createTestBrief } = await import('@/server/actions/briefs/debug');
    
    // Test database connection first
    console.log('Testing database connection...');
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      throw new Error('Database connection failed');
    }
    
    // Ensure local user exists
    console.log('Ensuring local user exists...');
    const userResult = await ensureLocalUser();
    if (!userResult.success) {
      throw new Error('Failed to create local user');
    }
    
    // Try creating a test brief first
    console.log('Creating test brief...');
    const testResult = await createTestBrief();
    if (!testResult.success) {
      throw new Error('Test brief creation failed');
    }
    
    // If test succeeded, proceed with actual brief creation
    const createBriefInput = {
      title: briefData.title.trim(),
      abstract: briefData.abstract?.trim() || "", 
      prompt: briefData.prompt?.trim() || "PROMPT UNKNOWN", 
      response: briefData.content.trim(),
      thinking: briefData.thinking?.trim() || undefined,
      modelId: modelId,
      categoryIds: [],
      sourceIds: [],
    };
    
    console.log('=== CREATE BRIEF INPUT ===');
    console.log('Title length:', createBriefInput.title.length);
    console.log('Response length:', createBriefInput.response.length);
    
    const result = await createBrief(createBriefInput);
    
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to create brief');
    }

    router.push(`/briefs/${result.data.id}`);
  } catch (err: unknown) {
    console.log('=== handleSubmit ERROR ===');
    console.log('Error details:', err instanceof Error ? err.message : String(err));
    setError(err instanceof Error ? err.message : 'Failed to create brief');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="overflow-x-hidden">
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