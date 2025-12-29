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

  const handleSubmit = async (briefData: BriefData) => {
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
        const result = await getDefaultModel(briefData.model);

        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Failed to get model');
        }

        modelId = result.data.id;
        setDefaultModelId(modelId);
      }

      // Create brief input
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

      const result = await createBrief(createBriefInput);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to create brief');
      }

      router.push(`/briefs/${result.data.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create brief';
      console.error('[BriefUpload] Failed to create brief:', err);
      setError(errorMessage);
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