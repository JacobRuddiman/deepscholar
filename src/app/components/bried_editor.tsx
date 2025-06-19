// components/brief/BriefEditor.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Link, 
  Code as CodeIcon,
  Trash2 
} from "lucide-react";

import HtmlInspector from './html_inspector';
import type { BriefData } from '@/functions/types';
import { extractBriefFromUrl } from './extract_brief';
import ErrorPopup from './error_popup';
import BriefVersionSelector from './BriefVersionSelector';
import TooltipWrapper from './TooltipWrapper';
import AddReferencePopup from './AddReferencePopup';
import { getBriefVersions, createBriefVersion, saveBriefDraft, updateBriefVersion, pushDraftToVersion, getBriefById, setActiveVersion } from '@/server/actions/briefs';
import { createBriefReference, getBriefReferences, deleteBriefReference, type BriefReference } from '@/server/actions/brief-references';

import {
  urlSchema,
  determineTheme,
  themeColors,
  groupSourcesByDomain,
  getUrlPath,
  getFaviconUrl,
  createDiffMarkup,
  markdownComponents,
  titleComponents,
  referenceComponents,
  sectionVariants,
  urlCardVariants
} from './brief_editor_utils';

const customStyles = `
  @keyframes flashGradient {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  
  .flash-gradient {
    animation: flashGradient 0.5s ease-in-out;
    animation-iteration-count: 6;
    animation-fill-mode: forwards;
  }
`;

async function fetchBriefFromUrl(url: string): Promise<BriefData> {
  try {
    return await extractBriefFromUrl(url);
  } catch (error) {
    console.error("Error fetching brief:", error);
    throw new Error("Failed to fetch brief data. Please check the URL and try again.");
  }
}

interface BriefVersion {
  id: string;
  versionNumber: number;
  changeLog?: string;
  createdAt: Date;
  isDraft: boolean;
  draftNumber?: number;
}

interface BriefEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
  briefId?: string;
  isOwner?: boolean;
}

export default function BriefEditor({ onSubmit, initialData, briefId, isOwner = false }: BriefEditorProps) {
  // State variables
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [showHtmlInspector, setShowHtmlInspector] = useState(false);
  
  // Version management state
  const [versions, setVersions] = useState<BriefVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<BriefVersion | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalBriefData, setOriginalBriefData] = useState<BriefData | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState(determineTheme(null));
  
  // Section visibility state
  const [showTitleSection, setShowTitleSection] = useState(false);
  const [showAbstractSection, setShowAbstractSection] = useState(false);
  const [showContentSection, setShowContentSection] = useState(false);
  const [showSourcesSection, setShowSourcesSection] = useState(false);
  const [showReferencesSection, setShowReferencesSection] = useState(false);
  const [showMetadataSection, setShowMetadataSection] = useState(false);
  
  // Toggle states for collapsible sections
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(true);
  
  // Edit mode states
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isAbstractEditing, setIsAbstractEditing] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [isThinkingEditing, setIsThinkingEditing] = useState(false);
  
  // Refs
  const bottomControlsRef = useRef<HTMLDivElement>(null);
  
  // Store original data for diff highlighting
  const [originalAbstract, setOriginalAbstract] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [abstractDiff, setAbstractDiff] = useState<string>("");
  const [contentDiff, setContentDiff] = useState<string>("");
  
  // Flash state
  const [highlightPublish, setHighlightPublish] = useState(false);
  const [highlightSave, setHighlightSave] = useState(false);
  
  // Success notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add this state for active tab
  const [activeSourcesDomain, setActiveSourcesDomain] = useState<string | null>(null);

  // Reference management state
  const [isAddReferenceOpen, setIsAddReferenceOpen] = useState(false);
  const [briefReferences, setBriefReferences] = useState<BriefReference[]>([]);

  // Handle adding a new reference
  const handleAddReference = async (url: string, highlightedText: string) => {
    if (!briefId) {
      // For new briefs, just store locally until saved
      const newReference = `[${highlightedText}](${url})`;
      const currentReferences = Array.isArray(briefData?.references) 
        ? briefData.references 
        : briefData?.references ? [briefData.references] : [];
      
      const updatedReferences = [...currentReferences, newReference];
      
      setBriefData(prev => prev ? {
        ...prev,
        references: updatedReferences.join('\n\n')
      } : null);
      return;
    }

    // For existing briefs, save to database
    try {
      const result = await createBriefReference(briefId, url, highlightedText);
      if (result.success && result.data) {
        setBriefReferences(prev => [result.data!, ...prev]);
        setSuccessMessage('Reference added successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to add reference');
      }
    } catch (error) {
      console.error('Error adding reference:', error);
      setError('Failed to add reference');
    }
  };

  // Load references for existing briefs
  useEffect(() => {
    if (briefId) {
      const loadReferences = async () => {
        try {
          const result = await getBriefReferences(briefId);
          if (result.success && result.data) {
            setBriefReferences(result.data);
          }
        } catch (error) {
          console.error('Error loading references:', error);
        }
      };
      void loadReferences();
    }
  }, [briefId]);

  // Load versions when briefId is provided
  useEffect(() => {
    if (briefId && isOwner) {
      void loadVersions();
    }
  }, [briefId, isOwner]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      // Transform the data to match BriefData interface
      const transformedData: BriefData = {
        title: initialData.title || '',
        content: (initialData as any).response || initialData.content || '',
        abstract: initialData.abstract || '',
        thinking: initialData.thinking || '',
        model: typeof (initialData as any).model === 'object' 
          ? ((initialData as any).model?.name as "OpenAI" | "Perplexity" | "Anthropic" | "Other") || 'Other'
          : (initialData.model as "OpenAI" | "Perplexity" | "Anthropic" | "Other") || 'Other',
        sources: (initialData as any).sources || [],
        references: (initialData as any).references || '',
        rawHtml: (initialData as any).rawHtml
      };

      setBriefData(transformedData);
      setOriginalBriefData(transformedData);
      setOriginalAbstract(transformedData.abstract || "");
      setOriginalContent(transformedData.content || "");
      setShowTitleSection(true);
      setShowAbstractSection(true);
      setShowContentSection(true);
      setShowSourcesSection(true);
      setShowReferencesSection(true);
      setShowMetadataSection(true);
      setTheme(determineTheme(transformedData.model));
      
      // Set current version if we have briefId
      if (briefId) {
        setCurrentVersion({
          id: briefId,
          versionNumber: (initialData as any).versionNumber || 1,
          changeLog: (initialData as any).changeLog,
          createdAt: (initialData as any).createdAt || new Date(),
          isDraft: (initialData as any).isDraft || false,
        });
      }
    }
  }, [initialData, briefId]);

  // Track changes to detect unsaved edits
  useEffect(() => {
    if (originalBriefData && briefData) {
      const hasChanges = 
        briefData.title !== originalBriefData.title ||
        briefData.abstract !== originalBriefData.abstract ||
        briefData.content !== originalBriefData.content ||
        briefData.thinking !== originalBriefData.thinking;
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [briefData, originalBriefData]);

  const loadVersions = async () => {
    if (!briefId) return;
    
    try {
      const result = await getBriefVersions(briefId);
      if (result.success && result.data) {
        setVersions(result.data as any);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleVersionChange = async (versionId: string) => {
    try {
      // Load the specific version data
      const result = await getBriefById(versionId);
      if (result.success && result.data) {
        const versionData = result.data;
        
        // Convert to BriefData format
        const briefDataFromVersion: BriefData = {
          title: versionData.title,
          abstract: versionData.abstract || '',
          content: versionData.response,
          thinking: versionData.thinking || '',
          model: (versionData.model?.name as "OpenAI" | "Perplexity" | "Anthropic" | "Other") || 'Other',
          sources: versionData.sources || [],
          references: '',
        };
        
        setBriefData(briefDataFromVersion);
        setOriginalBriefData(briefDataFromVersion);
        setOriginalAbstract(briefDataFromVersion.abstract || "");
        setOriginalContent(briefDataFromVersion.content || "");
        
        // Update current version
        const version = versions.find(v => v.id === versionId);
        if (version) {
          setCurrentVersion(version);
        }
        
        // Reset unsaved changes
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading version:', error);
    }
  };

  const handleSaveAsNewVersion = async (changeLog: string) => {
    if (!briefData || !briefId) return;

    try {
      const result = await createBriefVersion(
        briefId,
        {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: '',
          response: briefData.content || '',
          thinking: briefData.thinking,
          categoryIds: [],
          sourceIds: briefData.sources?.map((s: any) => s.id) || [],
        },
        changeLog
      );

      if (result.success && result.data) {
        // Update versions list and current version
        await loadVersions();
        setCurrentVersion({
          id: result.data.id,
          versionNumber: (result.data as any).versionNumber,
          changeLog: (result.data as any).changeLog,
          createdAt: result.data.createdAt,
          isDraft: false,
        });
        setHasUnsavedChanges(false);
        setOriginalBriefData(briefData);
      }
    } catch (error) {
      console.error('Error saving new version:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!briefData || !currentVersion) return;

    try {
      const result = await saveBriefDraft(
        currentVersion.id, // Use the current version ID, not the original briefId
        {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: '',
          response: briefData.content || '',
          thinking: briefData.thinking,
          categoryIds: [],
          sourceIds: briefData.sources?.map((s: any) => s.id) || [],
        }
      );

      if (result.success && result.data) {
        // Refresh the versions list first to get updated data
        await loadVersions();
        
        // Get the updated versions list to calculate draft number correctly
        const updatedVersionsResult = await getBriefVersions(briefId!);
        if (updatedVersionsResult.success && updatedVersionsResult.data) {
          const updatedVersions = updatedVersionsResult.data as any[];
          
          // Calculate the correct draft number for this version
          const versionNumber = (result.data as any).versionNumber;
          const draftsForThisVersion = updatedVersions.filter(v => 
            v.versionNumber === versionNumber && v.isDraft
          );
          const draftNumber = draftsForThisVersion.length; // This will be the correct number since we just created it
          
          // Update current version to the new draft
          setCurrentVersion({
            id: result.data.id,
            versionNumber: versionNumber,
            changeLog: (result.data as any).changeLog,
            createdAt: result.data.createdAt,
            isDraft: true,
            draftNumber: draftNumber,
          });
        }
        
        setHasUnsavedChanges(false);
        setOriginalBriefData(briefData);
        
        // Show success feedback
        setError(null);
        setSuccessMessage('Draft saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Failed to save draft. Please try again.');
    }
  };

  const handleUpdateCurrent = async () => {
    if (!briefData || !currentVersion) return;

    try {
      const result = await updateBriefVersion(
        currentVersion.id,
        {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: '',
          response: briefData.content || '',
          thinking: briefData.thinking,
          categoryIds: [],
          sourceIds: briefData.sources?.map((s: any) => s.id) || [],
        }
      );

      if (result.success) {
        setHasUnsavedChanges(false);
        setOriginalBriefData(briefData);
        await loadVersions();
      }
    } catch (error) {
      console.error('Error updating current version:', error);
    }
  };

  const handlePushToVersion = async () => {
    if (!briefData || !currentVersion?.isDraft) return;

    try {
      const result = await pushDraftToVersion(
        currentVersion.id,
        {
          title: briefData.title,
          abstract: briefData.abstract,
          prompt: '',
          response: briefData.content || '',
          thinking: briefData.thinking,
          categoryIds: [],
          sourceIds: briefData.sources?.map((s: any) => s.id) || [],
        }
      );

      if (result.success && result.data) {
        // Switch to the updated published version
        await handleVersionChange(result.data.id);
        await loadVersions();
      }
    } catch (error) {
      console.error('Error pushing draft to version:', error);
    }
  };

  const handleRenameVersion = async (newName: string) => {
    if (!currentVersion) return;

    try {
      const { renameBriefVersion } = await import('@/server/actions/briefs');
      const result = await renameBriefVersion(currentVersion.id, newName);

      if (result.success) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Error renaming version:', error);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      const { deleteBrief } = await import('@/server/actions/briefs');
      const result = await deleteBrief(versionId);

      if (result.success) {
        // If we deleted the current version, we need to navigate away or to another version
        if (versionId === currentVersion?.id) {
          // Find another version to switch to, or navigate away if this was the last one
          const remainingVersions = versions.filter(v => v.id !== versionId);
          if (remainingVersions.length > 0) {
            // Switch to the most recent remaining version
            const latestVersion = remainingVersions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
            if (latestVersion) {
              await handleVersionChange(latestVersion.id);
            }
          } else {
            // No versions left, navigate away (this should only happen if deleting the last version)
            window.location.href = '/my-briefs';
            return;
          }
        }
        
        await loadVersions();
      }
    } catch (error) {
      console.error('Error deleting version:', error);
    }
  };
  
  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    try {
      urlSchema.parse(newUrl);
      setIsValidUrl(true);
      setError(null);
    } catch {
      setIsValidUrl(newUrl.length > 0 ? false : null);
      setError(newUrl.length > 0 ? "Please enter a valid URL" : null);
    }
  };
  
  // Handle fetch brief action
  const handleFetchBrief = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await fetchBriefFromUrl(url);
      setBriefData(data);
      
      // Update theme based on the fetched data
      setTheme(determineTheme(data));
      
      // Store original data for diffing
      setOriginalAbstract(data.abstract || "");
      setOriginalContent(data.content || "");
      
      // Reveal sections sequentially with delays
      setShowTitleSection(true);
      setTimeout(() => setShowAbstractSection(true), 200);
      setTimeout(() => setShowContentSection(true), 400);
      setTimeout(() => setShowSourcesSection(true), 600);
      setTimeout(() => setShowReferencesSection(true), 700);
      setTimeout(() => setShowMetadataSection(true), 1100);
      
    } catch (error) {
      console.error("Error fetching brief:", error);
      setError("Failed to fetch brief data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clearing the form
  const handleClearForm = () => {
    // Reset all state variables
    setUrl("");
    setIsValidUrl(null);
    setError(null);
    setBriefData(null);
    setShowTitleSection(false);
    setShowAbstractSection(false);
    setShowContentSection(false);
    setShowSourcesSection(false);
    setShowReferencesSection(false);
    setShowMetadataSection(false);
    setOriginalAbstract("");
    setOriginalContent("");
    setAbstractDiff("");
    setContentDiff("");
    setHighlightPublish(false);
    setHighlightSave(false);
    setActiveSourcesDomain(null);
    setIsSourcesExpanded(true);
    setIsReferencesExpanded(true);
    setIsContentExpanded(true);
    setIsTitleEditing(false);
    setIsAbstractEditing(false);
    setIsContentEditing(false);
    setTheme(determineTheme(null));
  };
  
  // Handle title edit
  const handleTitleEdit = (newTitle: string) => {
    if (briefData) {
      setBriefData({
        ...briefData,
        title: newTitle
      });
    }
    setIsTitleEditing(false);
  };
  
  // Handle abstract edit
  const handleAbstractEdit = (newAbstract: string) => {
    if (briefData) {
      setBriefData({
        ...briefData,
        abstract: newAbstract
      });
      // Update diff with the theme's highlight color
      setAbstractDiff(createDiffMarkup(
        originalAbstract,
        newAbstract,
        themeColors[theme].highlight
      ));
    }
    setIsAbstractEditing(false);
  };
  
  // Handle content edit
  const handleContentEdit = (newContent: string) => {
    if (briefData) {
      setBriefData({
        ...briefData,
        content: newContent
      });
      // Update diff with the theme's highlight color
      setContentDiff(createDiffMarkup(
        originalContent,
        newContent,
        themeColors[theme].highlight
      ));
    }
    setIsContentEditing(false);
  };
  
  // Scroll to bottom controls
  const scrollToBottom = () => {
    if (bottomControlsRef.current) {
      bottomControlsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };
  
  // Handle publish from top button
  const handleTopPublish = () => {
    setHighlightPublish(true);
    scrollToBottom();
    
    // Animation will stop at the low point due to CSS animation-fill-mode
    setTimeout(() => {
      setHighlightPublish(false);
    }, 3000);
  };
  
  // Handle save draft from top button
  const handleTopSaveDraft = () => {
    setHighlightSave(true);
    scrollToBottom();
    
    // Animation will stop at the low point due to CSS animation-fill-mode
    setTimeout(() => {
      setHighlightSave(false);
    }, 3000);
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (briefData && onSubmit) {
      onSubmit(briefData);
    }
  };
  
  // Get current theme color set
  const colors = themeColors[theme];

  // Check if we're currently viewing a draft
  const isDraftMode = currentVersion?.isDraft || false;
  
  return (
    <>
      <style>{customStyles}</style>
      <div className="relative min-h-screen">
        {/* Background gradient that covers full height */}
        <div className={`fixed inset-0 bg-gradient-to-b ${colors.primary} pointer-events-none z-0`} />
        
        {/* Draft border overlay */}
        {isDraftMode && (
          <div className="fixed inset-0 border-4 border-yellow-400 pointer-events-none z-50" />
        )}
        
        {/* Success Notification */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </motion.div>
        )}
        
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          {/* HTML Inspector Modal */}
          {briefData?.rawHtml && (
            <HtmlInspector
              html={briefData.rawHtml}
              isOpen={showHtmlInspector}
              onClose={() => setShowHtmlInspector(false)}
            />
          )}
          
          <h1 className="text-3xl font-bold text-center my-6">
            {briefId ? 'Edit Research Brief' : 'Upload Research Brief'}
            {isDraftMode && (
              <span className="ml-2 px-3 py-1 text-lg bg-yellow-100 text-yellow-800 rounded-full">
                Draft Mode
              </span>
            )}
          </h1>

          {/* Version Selector - Only show for existing briefs where user is owner */}
          {briefId && isOwner && currentVersion && (
            <div className="mb-6 flex justify-center">
              <BriefVersionSelector
                briefId={briefId}
                currentVersion={currentVersion}
                versions={versions}
                onVersionChange={handleVersionChange}
                onSaveAsNewVersion={handleSaveAsNewVersion}
                onSaveDraft={handleSaveDraft}
                onUpdateCurrent={handleUpdateCurrent}
                onPushToVersion={handlePushToVersion}
                onRenameVersion={handleRenameVersion}
                onDeleteVersion={handleDeleteVersion}
                onSetActiveVersion={async (versionId: string) => {
                  const result = await setActiveVersion(versionId);
                  if (result.success) {
                    // Refresh the versions list to update the UI
                    await loadVersions();
                  }
                }}
                isOwner={isOwner}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>
          )}
          
          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* URL Input Section */}
            <motion.div
              className={`${showTitleSection ? 'col-span-3' : 'col-span-8 col-start-3'}`}
              variants={urlCardVariants}
              initial="center"
              animate={showTitleSection ? "left" : "center"}
            >
              {/* Only show URL input if not editing existing brief */}
              {!briefId && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4">
                  <label htmlFor="brief-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Research URL
                  </label>
                  <div className="flex flex-col">
                    <div className="relative flex-1 mb-2">
                      <input
                        id="brief-url"
                        type="text"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Paste research URL"
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:outline-none ${
                          isValidUrl === true ? 'border-green-500 focus:ring-green-200' :
                          isValidUrl === false ? 'border-red-500 focus:ring-red-200' :
                          'border-gray-300 focus:ring-blue-200'
                        }`}
                      />
                      {isValidUrl === true && (
                        <CheckCircle className="absolute right-3 top-2 text-green-500" size={18} />
                      )}
                      {isValidUrl === false && (
                        <AlertCircle className="absolute right-3 top-2 text-red-500" size={18} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <TooltipWrapper 
                        content={isValidUrl ? "Extract research content from the provided URL" : "Enter a valid research URL first"}
                        position="bottom"
                      >
                        <button
                          onClick={handleFetchBrief}
                          disabled={!isValidUrl || isLoading}
                          className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors ${showTitleSection ? 'text-sm' : ''}`}
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin mx-auto" size={20} />
                          ) : (
                            "Fetch Brief"
                          )}
                        </button>
                      </TooltipWrapper>
                      
                      {/* Clear button - only shown when brief data exists */}
                      {briefData && (
                        <TooltipWrapper 
                          content="Clear all form data and start over"
                          position="bottom"
                        >
                          <button
                            onClick={handleClearForm}
                            className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            <span>Clear Form</span>
                          </button>
                        </TooltipWrapper>
                      )}
                      
                      {briefData?.rawHtml && (
                        <TooltipWrapper 
                          content="View the raw HTML content extracted from the URL"
                          position="bottom"
                        >
                          <button
                            onClick={() => setShowHtmlInspector(true)}
                            className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <CodeIcon size={16} />
                            <span>Inspect HTML</span>
                          </button>
                        </TooltipWrapper>
                      )}
                    </div>
                  </div>
                  {!showTitleSection && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Supports OpenAI and Perplexity deep research URLs
                    </p>
                  )}
                </div>
              )}
              
              <ErrorPopup
                isVisible={!!error}
                message={error ?? ''}
                onClose={() => setError(null)}
                autoClose={true}
              />
              
              {/* Sources Section */}
              <motion.div
                initial="hidden"
                animate={showSourcesSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 ${briefId ? '' : 'mt-6'}`}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                >
                  <h2 className="text-lg font-semibold">Sources</h2>
                  <button className="text-gray-500 p-1" aria-label="Toggle sources">
                    {isSourcesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                
                {isSourcesExpanded && (
                  <div className="mt-3">
                    {briefData?.sources && briefData.sources.length > 0 ? (
                      <div>
                        {/* Tabs */}
                        {(() => {
                          const sourceGroups = groupSourcesByDomain(briefData.sources);
                          const domains = Array.from(sourceGroups.keys());
                          
                          if (!activeSourcesDomain && domains.length > 0) {
                            setActiveSourcesDomain(domains[0] as string);
                          }
                          
                          return (
                            <>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(domains as string[]).map((domain: string) => (
                                  <button
                                    key={domain}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSourcesDomain(domain);
                                    }}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                      activeSourcesDomain === domain
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {domain}
                                    <span className="ml-1 text-xs">
                                      ({sourceGroups.get(domain)?.length})
                                    </span>
                                  </button>
                                ))}
                              </div>
                              
                              {/* Source List */}
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {activeSourcesDomain && sourceGroups.get(activeSourcesDomain)?.map((source: BriefData['sources'][0], index: number) => {
                                  const favicon = getFaviconUrl(activeSourcesDomain);
                                  return (
                                    <div 
                                      key={index} 
                                      className="p-2 border rounded-md border-gray-200 text-sm break-words"
                                    >
                                      <div className="flex items-start gap-2">
                                        <img 
                                          src={favicon} 
                                          alt={`${activeSourcesDomain} favicon`}
                                          className="w-4 h-4 mt-1 flex-shrink-0"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                        <Link className="text-gray-500 mt-1 flex-shrink-0 hidden" size={14} />
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium line-clamp-2">{source.title}</p>
                                          <a 
                                            href={source.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline block truncate"
                                            onClick={(e) => e.stopPropagation()}
                                            title={source.url}
                                          >
                                            {getUrlPath(source.url)}
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="py-3 text-center text-gray-500 text-sm">
                        <p>No sources found.</p>
                        <TooltipWrapper 
                          content="Add a new source reference to this brief"
                          position="top"
                        >
                          <button className="mt-1 text-blue-600 hover:underline text-xs">Add Source</button>
                        </TooltipWrapper>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Main Content Area - Right side */}
            <div className={`${showTitleSection ? 'col-span-9' : 'col-span-0'}`}>
              {/* Brief Title Section */}
              <motion.div
                initial="hidden"
                animate={showTitleSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary} ${isDraftMode ? 'border-yellow-400 border-2' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Brief Title</h2>
                  {briefData?.model && (
                    <span className={`px-2 py-1 ${colors.highlight} ${colors.tertiary} rounded-full text-xs font-medium`}>
                      {briefData.model}
                    </span>
                  )}
                </div>
                
                {isTitleEditing ? (
                  <div className="mb-2">
                    <input
                      type="text"
                      defaultValue={briefData?.title ?? ""}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200"
                      onBlur={(e) => handleTitleEdit(e.target.value)}
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {briefData?.title?.length ?? 0}/100 characters
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize, rehypeRaw]}
                        components={titleComponents}
                      >
                        {briefData?.title ?? "Untitled Brief"}
                      </ReactMarkdown>
                    </h3>
                    <TooltipWrapper 
                      content="Edit the brief title"
                      position="left"
                    >
                      <button 
                        onClick={() => setIsTitleEditing(true)}
                        className={`hover:${colors.tertiary} p-1`}
                        aria-label="Edit title"
                      >
                        <Edit2 size={16} className={colors.tertiary} />
                      </button>
                    </TooltipWrapper>
                  </div>
                )}
              </motion.div>
              
              {/* Abstract Section */}
              <motion.div
                initial="hidden"
                animate={showAbstractSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary} ${isDraftMode ? 'border-yellow-400 border-2' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Abstract/Conclusion</h2>
                  {!isAbstractEditing && (
                    <TooltipWrapper 
                      content="Edit the brief abstract or conclusion"
                      position="left"
                    >
                      <button 
                        onClick={() => setIsAbstractEditing(true)}
                        className={`hover:${colors.tertiary} p-1`}
                        aria-label="Edit abstract"
                      >
                        <Edit2 size={16} className={colors.tertiary} />
                      </button>
                    </TooltipWrapper>
                  )}
                </div>
                
                {isAbstractEditing ? (
                  <div>
                    <textarea
                      defaultValue={briefData?.abstract ?? ""}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 min-h-[120px]"
                      onBlur={(e) => handleAbstractEdit(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{briefData?.abstract?.length ?? 0} characters</span>
                      <button 
                        onClick={() => setIsAbstractEditing(false)}
                        className="text-blue-600 hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {abstractDiff ? (
                      <div dangerouslySetInnerHTML={{ __html: abstractDiff }} className="prose max-w-none" />
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize, rehypeRaw]}
                        components={markdownComponents}
                      >
                        {briefData?.abstract ?? "No abstract available"}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </motion.div>
              
              {/* Brief Content Section */}
              <motion.div
                initial="hidden"
                animate={showContentSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 overflow-y-auto border ${colors.secondary} ${isDraftMode ? 'border-yellow-400 border-2' : ''}`}
              >
                <div 
                  className="flex justify-between items-center mb-2 cursor-pointer"
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                >
                  <h2 className="text-lg font-semibold">Research Summary</h2>
                  <div className="flex items-center gap-2">
                    {!isContentEditing && (
                      <TooltipWrapper 
                        content="Edit the research summary content"
                        position="left"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsContentEditing(true);
                          }}
                          className={`hover:${colors.tertiary} p-1`}
                          aria-label="Edit content"
                        >
                          <Edit2 size={16} className={colors.tertiary} />
                        </button>
                      </TooltipWrapper>
                    )}
                    <TooltipWrapper 
                      content={isContentExpanded ? "Collapse content section" : "Expand content section"}
                      position="left"
                    >
                      <button className="text-gray-500 p-1" aria-label="Toggle content">
                        {isContentExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </TooltipWrapper>
                  </div>
                </div>
                
                {isContentExpanded && (
                  <div>
                    {isContentEditing ? (
                      <div>
                        <textarea
                          defaultValue={briefData?.content ?? ""}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 min-h-[300px]"
                          onBlur={(e) => handleContentEdit(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>{briefData?.content?.length ?? 0} characters</span>
                          <button 
                            onClick={() => setIsContentEditing(false)}
                            className="text-blue-600 hover:underline"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose max-w-none">
                        {contentDiff ? (
                          <div dangerouslySetInnerHTML={{ __html: contentDiff }} className="prose max-w-none" />
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize, rehypeRaw]}
                            components={markdownComponents}
                          >
                            {briefData?.content ?? "No content available"}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* References Section */}
              <motion.div
                initial="hidden"
                animate={showReferencesSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary} ${isDraftMode ? 'border-yellow-400 border-2' : ''}`}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setIsReferencesExpanded(!isReferencesExpanded)}
                >
                  <h2 className="text-lg font-semibold">References</h2>
                  <button className="text-gray-500 p-1" aria-label="Toggle references">
                    {isReferencesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                
                {isReferencesExpanded && (
                  <div className="mt-3">
                    {briefId ? (
                      // For existing briefs, show database references
                      briefReferences.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {briefReferences.map((reference) => (
                            <div key={reference.id} className="p-3 border rounded-md border-gray-200 text-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 mb-1">
                                    "{reference.highlightedText}"
                                  </p>
                                  <a 
                                    href={reference.source.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    {reference.source.title}
                                  </a>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      const result = await deleteBriefReference(reference.id);
                                      if (result.success) {
                                        setBriefReferences(prev => prev.filter(r => r.id !== reference.id));
                                        setSuccessMessage('Reference deleted successfully!');
                                        setTimeout(() => setSuccessMessage(null), 3000);
                                      } else {
                                        setError(result.error || 'Failed to delete reference');
                                      }
                                    } catch (error) {
                                      console.error('Error deleting reference:', error);
                                      setError('Failed to delete reference');
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete reference"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-3 text-center text-gray-500 text-sm">
                          <p>No references found.</p>
                          <button 
                            onClick={() => setIsAddReferenceOpen(true)}
                            className="mt-1 text-blue-600 hover:underline text-xs"
                          >
                            Add Reference
                          </button>
                        </div>
                      )
                    ) : (
                      // For new briefs, show local references
                      briefData?.references && briefData.references.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Array.isArray(briefData.references) ? briefData.references.map((reference: string, index: number) => (
                            <div key={index} className="p-2 border rounded-md border-gray-200 text-sm">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeSanitize, rehypeRaw]}
                                components={referenceComponents}
                              >
                                {reference}
                              </ReactMarkdown>
                            </div>
                          )) : null}
                        </div>
                      ) : (
                        <div className="py-3 text-center text-gray-500 text-sm">
                          <p>No references found.</p>
                          <button 
                            onClick={() => setIsAddReferenceOpen(true)}
                            className="mt-1 text-blue-600 hover:underline text-xs"
                          >
                            Add Reference
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </motion.div>

              {/* Metadata Section */}
              <motion.div
                initial="hidden"
                animate={showMetadataSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary} ${isDraftMode ? 'border-yellow-400 border-2' : ''}`}
              >
                <h2 className="text-lg font-semibold mb-3">Metadata</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Model:</span>
                    <p className="mt-1">{briefData?.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Word Count:</span>
                    <p className="mt-1">{briefData?.content?.split(' ').length ?? 0} words</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Sources:</span>
                    <p className="mt-1">{briefData?.sources?.length ?? 0} sources</p>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Controls */}
              <motion.div
                ref={bottomControlsRef}
                initial="hidden"
                animate={showMetadataSection ? "visible" : "hidden"}
                variants={sectionVariants}
                className="flex justify-center gap-4 mt-6"
              >
                {briefId && isOwner ? (
                  // Edit mode - show save buttons
                  <>
                    {hasUnsavedChanges && (
                      <button
                        onClick={handleSaveDraft}
                        className={`px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors ${
                          highlightSave ? 'flash-gradient' : ''
                        }`}
                      >
                        Save Draft
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // This would trigger the version selector modal
                        const changeLog = prompt('Describe the changes made in this version:');
                        if (changeLog) {
                          void handleSaveAsNewVersion(changeLog);
                        }
                      }}
                      className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
                        highlightPublish ? 'flash-gradient' : ''
                      }`}
                    >
                      Save as New Version
                    </button>
                  </>
                ) : (
                  // Create mode - show publish button
                  <button
                    onClick={handleSubmit}
                    disabled={!briefData}
                    className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors ${
                      highlightPublish ? 'flash-gradient' : ''
                    }`}
                  >
                    Publish Brief
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Add Reference Popup */}
        <AddReferencePopup
          isOpen={isAddReferenceOpen}
          onClose={() => setIsAddReferenceOpen(false)}
          onAddReference={handleAddReference}
          existingSources={briefData?.sources?.map(source => ({
            id: source.url, // Use URL as ID since BriefSource doesn't have id
            url: source.url,
            title: source.title,
            domain: new URL(source.url).hostname
          })) || []}
          briefContent={briefData?.content || ''}
          briefAbstract={briefData?.abstract || ''}
        />
      </div>
    </>
  );
}
