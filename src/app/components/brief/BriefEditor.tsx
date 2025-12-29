// app/components/brief/BriefEditor.tsx
"use client";

import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import MobileBriefEditor from './MobileBriefEditor';
import TabletBriefEditor from './TabletBriefEditor';
import DesktopBriefEditor from '../BriefEditorDesktop';
import type { BriefData } from '@/functions/types';

interface BriefEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
  briefId?: string;
  isOwner?: boolean;
  inputMode?: 'url' | 'content';
  onInputModeChange?: (mode: 'url' | 'content') => void;
}

export default function BriefEditor(props: BriefEditorProps) {
  const { isMobile, isTablet } = useDeviceDetection();

  if (isMobile) {
    console.info("Using Mobile ===============================")
    return <MobileBriefEditor {...props} />;
  }

  if (isTablet) {
        console.info("Using Tablet===============================")

    return <TabletBriefEditor {...props} />;
  }
  console.info("Using Desktop ===============================")

  // Use the full-featured desktop editor with version control
  return <DesktopBriefEditor {...props} />;
}