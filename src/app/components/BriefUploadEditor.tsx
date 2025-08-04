import React from "react";
import type { BriefData } from '@/functions/types';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import MobileBriefUploadEditor from './MobileBriefUploadEditor';
import DesktopBriefUploadEditor from './DesktopBriefUploadEditor';
import { extractBriefFromUrl } from './extract_brief';

// Helper function to fetch brief from URL
async function fetchBriefFromUrl(url: string): Promise<BriefData> {
  try {
    return await extractBriefFromUrl(url);
  } catch (error) {
    console.error("Error fetching brief:", error);
    throw new Error("Failed to fetch brief data. Please check the URL and try again.");
  }
}

interface BriefUploadEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
  isSubmitting?: boolean;
}

export default function BriefUploadEditor({ 
  onSubmit, 
  initialData,
  isSubmitting = false 
}: BriefUploadEditorProps) {
  const { isMobile, isTablet } = useDeviceDetection();
  const isSmallScreen = isMobile || isTablet;

  if (isSmallScreen) {
    return (
      <MobileBriefUploadEditor
        onSubmit={onSubmit}
        initialData={initialData}
        fetchBriefFromUrl={fetchBriefFromUrl}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <DesktopBriefUploadEditor
      onSubmit={onSubmit}
      initialData={initialData}
      fetchBriefFromUrl={fetchBriefFromUrl}
      isSubmitting={isSubmitting}
    />
  );
}