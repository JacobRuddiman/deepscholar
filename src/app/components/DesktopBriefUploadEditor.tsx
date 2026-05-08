import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Trash2,
  ArrowLeft,
  X,
  Tag,
  Sparkles
} from "lucide-react";
import { FileDropzone } from '@/components/ui/FileDropzone';

import HtmlInspector from './html_inspector';
import type { BriefData, BriefSource, ConversationTurn } from '@/functions/types';
import { useCategories } from '@/hooks/queries/useCategories';
import { suggestCategories } from '@/server/actions/briefs/suggest-categories';
import ErrorPopup from './error_popup';
import TooltipWrapper from './TooltipWrapper';
import AddReferencePopup from './AddReferencePopup';
import { applySelectedConversationTurn } from '@/lib/extraction/normalize';
import { parseManualBriefContent } from '@/functions/parsers/manual_parser';
import { validateClaudeExport } from '@/functions/parsers/claude_export_validator';
import ConversationTurnSelector from './ConversationTurnSelector';

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
  urlCardVariants,
  PROVIDER_CONFIG,
} from './brief_editor_utils';
import type { ProviderId, ProviderConfig } from './brief_editor_utils';

const customStyles = `
  .reference-highlight {
    background-color: #fef3c7;
    border-bottom: 2px solid #f59e0b;
    padding: 2px 4px;
    border-radius: 2px;
    font-style: italic;
    color: #92400e;
  }

  .reference-source {
    color: #2563eb;
    text-decoration: none;
    font-size: 0.875em;
    margin-left: 4px;
  }

  .reference-source:hover {
    text-decoration: underline;
  }
`;

/** Extended BriefData that may include DB fields when editing an existing brief */
interface InitialBriefData extends Omit<BriefData, 'model'> {
  content?: string;
  versionNumber?: number;
  changeLog?: string;
  createdAt?: Date;
  isDraft?: boolean;
  categories?: Array<{ id: string; name: string }>;
  model?: string | { name?: string } | BriefData['model'];
}

interface DesktopBriefUploadEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: InitialBriefData;
  fetchBriefFromUrl: (url: string) => Promise<BriefData>;
  isSubmitting?: boolean;
}
export default function DesktopBriefUploadEditor({ 
  onSubmit, 
  initialData,
  fetchBriefFromUrl,
  isSubmitting
}: DesktopBriefUploadEditorProps) {
  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);

  // State variables
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [showHtmlInspector, setShowHtmlInspector] = useState(false);

  // Conversation turn selection
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[] | null>(null);
  const [showTurnSelector, setShowTurnSelector] = useState(false);
  const [pendingBriefData, setPendingBriefData] = useState<BriefData | null>(null);

  // Manual entry states
  const [manualContent, setManualContent] = useState("");
  const [otherInputMode, setOtherInputMode] = useState<'manual' | 'file'>('manual');

  // Claude file validation warning
  const [claudeWarning, setClaudeWarning] = useState<string | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState(determineTheme(null));
  
  // Section visibility state
  const [showTitleSection, setShowTitleSection] = useState(false);
  const [showPromptSection, setShowPromptSection] = useState(false);
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
  const [isPromptEditing, setIsPromptEditing] = useState(false);
  const [isAbstractEditing, setIsAbstractEditing] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  
  // Refs
  const bottomControlsRef = useRef<HTMLDivElement>(null);
  const urlValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store original data for diff highlighting
  const [originalAbstract, setOriginalAbstract] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [abstractDiff, setAbstractDiff] = useState<string>("");
  const [contentDiff, setContentDiff] = useState<string>("");
  
  // Flash state
  const [highlightPublish, setHighlightPublish] = useState(false);
  
  // Success notification state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add this state for active tab
  const [activeSourcesDomain, setActiveSourcesDomain] = useState<string | null>(null);

  // Category selection state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState<string[]>([]);
  const [isSuggestingCategories, setIsSuggestingCategories] = useState(false);
  const categoriesQuery = useCategories();

  // Reference management state
  const [isAddReferenceOpen, setIsAddReferenceOpen] = useState(false);

  // Validate URL with debouncing
  const validateUrl = (value: string) => {
    // Clear previous timeout
    if (urlValidationTimeoutRef.current) {
      clearTimeout(urlValidationTimeoutRef.current);
    }

    // Don't validate empty strings
    if (!value) {
      setIsValidUrl(null);
      setError(null);
      return;
    }

    // Set a new timeout for validation
    urlValidationTimeoutRef.current = setTimeout(() => {
      try {
        urlSchema.parse(value);
        setIsValidUrl(true);
        setError(null);
      } catch {
        setIsValidUrl(false);
        // Only show error if there's actually text
        if (value.length > 0) {
          setError("Please enter a valid URL");
        }
      }
    }, 500); // 500ms delay
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    validateUrl(newUrl);
  };

  // Handle adding a new reference
  const handleAddReference = async (url: string, highlightedText: string) => {
    const newReference = `[${highlightedText}](${url})`;
    const currentReferences = Array.isArray(briefData?.references) 
      ? briefData.references 
      : briefData?.references ? [briefData.references] : [];
    
    const updatedReferences = [...currentReferences, newReference];
    
    setBriefData(prev => prev ? {
      ...prev,
      references: updatedReferences.join('\n\n')
    } : null);
  };

  // Load initial data
  useEffect(() => {
    if (initialData) {
      const modelValue = initialData.model;
      const transformedData: BriefData = {
        title: initialData.title || '',
        response: initialData.response || initialData.content || '',
        abstract: initialData.abstract || '',
        thinking: initialData.thinking || '',
        prompt: initialData.prompt || '',
        model: (typeof modelValue === 'object' && modelValue !== null
          ? ((modelValue as { name?: string }).name || 'other')
          : (String(modelValue) || 'other')).toLowerCase() as "openai" | "perplexity" | "anthropic" | "other",
        sources: initialData.sources || [],
        references: initialData.references || '',
        rawHtml: initialData.rawHtml
      };

      setBriefData(transformedData);
      setOriginalAbstract(transformedData.abstract || "");
      setOriginalContent(transformedData.response || "");
      setShowTitleSection(true);
      setShowPromptSection(true);
      setShowAbstractSection(true);
      setShowContentSection(true);
      setShowSourcesSection(true);
      setShowReferencesSection(true);
      setShowMetadataSection(true);
      setTheme(determineTheme(transformedData));
      fetchCategorySuggestions(transformedData);
    }
  }, [initialData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (urlValidationTimeoutRef.current) {
        clearTimeout(urlValidationTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle fetch brief action
  const handleFetchBrief = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchBriefFromUrl(url);

      // Set default prompt if not provided
      if (!data.prompt) {
        data.prompt = "";
      }

      // Check if there are multiple conversation turns
      if (data.conversationTurns && data.conversationTurns.length > 1) {
        // Multiple turns detected - show selector
        setConversationTurns(data.conversationTurns);
        setPendingBriefData(data);
        setShowTurnSelector(true);
        setIsLoading(false);
        return;
      }

      // Single turn or no turns - proceed normally
      setBriefData(data);

      setTheme(determineTheme(data));

      setOriginalAbstract(data.abstract || "");
      setOriginalContent(data.response || "");

      setShowTitleSection(true);
      setTimeout(() => setShowPromptSection(true), 150);
      setTimeout(() => setShowAbstractSection(true), 300);
      setTimeout(() => setShowContentSection(true), 450);
      setTimeout(() => setShowSourcesSection(true), 600);
      setTimeout(() => setShowReferencesSection(true), 750);
      setTimeout(() => setShowMetadataSection(true), 900);
      fetchCategorySuggestions(data);

    } catch (error) {
      console.error("Error fetching brief:", error);
      setError("Failed to fetch brief data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle conversation turn selection
  const handleTurnSelect = (turnIndex: number) => {
    if (!pendingBriefData || !conversationTurns) return;

    const updatedBriefData = applySelectedConversationTurn(pendingBriefData, turnIndex);

    setBriefData(updatedBriefData);
    setTheme(determineTheme(updatedBriefData));
    setOriginalAbstract(updatedBriefData.abstract || "");
    setOriginalContent(updatedBriefData.response || "");

    // Hide selector and show sections
    setShowTurnSelector(false);
    setConversationTurns(null);
    setPendingBriefData(null);

    setShowTitleSection(true);
    setTimeout(() => setShowPromptSection(true), 150);
    setTimeout(() => setShowAbstractSection(true), 300);
    setTimeout(() => setShowContentSection(true), 450);
    setTimeout(() => setShowSourcesSection(true), 600);
    setTimeout(() => setShowReferencesSection(true), 750);
    setTimeout(() => setShowMetadataSection(true), 900);
    fetchCategorySuggestions(updatedBriefData);
  };

  const handleTurnSelectCancel = () => {
    setShowTurnSelector(false);
    setConversationTurns(null);
    setPendingBriefData(null);
  };

  // Handle manual content parsing
  const handleManualParse = () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!manualContent.trim()) {
        setError("Please paste some content to parse");
        setIsLoading(false);
        return;
      }

      const data = parseManualBriefContent(manualContent);

      // Set default prompt if not provided
      if (!data.prompt) {
        data.prompt = "";
      }

      setBriefData(data);
      setTheme(determineTheme(data));

      setOriginalAbstract(data.abstract || "");
      setOriginalContent(data.response || "");

      setShowTitleSection(true);
      setTimeout(() => setShowPromptSection(true), 150);
      setTimeout(() => setShowAbstractSection(true), 300);
      setTimeout(() => setShowContentSection(true), 450);
      setTimeout(() => setShowSourcesSection(true), 600);
      setTimeout(() => setShowReferencesSection(true), 750);
      setTimeout(() => setShowMetadataSection(true), 900);
      fetchCategorySuggestions(data);

    } catch (error) {
      console.error("Error parsing manual content:", error);
      setError("Failed to parse content. Please check the format and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file upload - reads text content and feeds it through manual parse
  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setClaudeWarning(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text?.trim()) {
        setError("File is empty");
        setIsLoading(false);
        return;
      }

      try {
        // Check if this is a Claude deep research export
        const claudeValidation = validateClaudeExport(text, file.name);

        const data = parseManualBriefContent(text);
        if (!data.prompt) {
          data.prompt = "";
        }

        // If validated as Claude export, set model to anthropic
        if (claudeValidation.isValid) {
          data.model = 'anthropic';
        } else if (selectedProvider === 'claude') {
          // Claude provider selected but validation failed — show warning
          setClaudeWarning("This file doesn't appear to be a Claude deep research export. It will still be parsed, but the content may not be structured as expected.");
          data.model = 'anthropic';
        }

        // If a provider is selected, use its model
        if (selectedProvider && selectedProvider !== 'other') {
          const providerConfig = PROVIDER_CONFIG.find(p => p.id === selectedProvider);
          if (providerConfig) {
            data.model = providerConfig.model;
          }
        }

        setBriefData(data);
        setTheme(determineTheme(data));
        setOriginalAbstract(data.abstract || "");
        setOriginalContent(data.response || "");

        setShowTitleSection(true);
        setTimeout(() => setShowPromptSection(true), 150);
        setTimeout(() => setShowAbstractSection(true), 300);
        setTimeout(() => setShowContentSection(true), 450);
        setTimeout(() => setShowSourcesSection(true), 600);
        setTimeout(() => setShowReferencesSection(true), 750);
        setTimeout(() => setShowMetadataSection(true), 900);
        fetchCategorySuggestions(data);
      } catch (err) {
        console.error("Error parsing file content:", err);
        setError("Failed to parse file content. Please check the format.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [selectedProvider]);

  // Handle clearing the form
  const handleClearForm = () => {
    setUrl("");
    setManualContent("");
    setIsValidUrl(null);
    setError(null);
    setBriefData(null);
    setShowTitleSection(false);
    setShowPromptSection(false);
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
    setActiveSourcesDomain(null);
    setIsSourcesExpanded(true);
    setIsReferencesExpanded(true);
    setIsContentExpanded(true);
    setIsTitleEditing(false);
    setIsPromptEditing(false);
    setIsAbstractEditing(false);
    setIsContentEditing(false);
    setTheme(determineTheme(null));
    setSelectedProvider(null);
    setClaudeWarning(null);
    setOtherInputMode('manual');
    setSelectedCategoryIds([]);
    setSuggestedCategoryIds([]);
  };

  // Fetch category suggestions after extraction completes
  const fetchCategorySuggestions = async (data: BriefData) => {
    setIsSuggestingCategories(true);
    try {
      const result = await suggestCategories({
        title: data.title,
        abstract: data.abstract ?? '',
        response: data.response,
        prompt: data.prompt ?? '',
        sourceUrls: (data.sources ?? []).map(s => s.url).filter(Boolean),
      });
      if (result.success && result.data && result.data.length > 0) {
        const ids = result.data.map(c => c.id);
        setSelectedCategoryIds(ids);
        setSuggestedCategoryIds(ids);
      }
    } catch {
      // Non-blocking — don't show error for category suggestion failures
    } finally {
      setIsSuggestingCategories(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, categoryId];
    });
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
  
  // Handle prompt edit
  const handlePromptEdit = (newPrompt: string) => {
    if (briefData) {
      setBriefData({
        ...briefData,
        prompt: newPrompt
      });
    }
    setIsPromptEditing(false);
  };
  
  // Handle abstract edit
  const handleAbstractEdit = (newAbstract: string) => {
    if (briefData) {
      setBriefData({
        ...briefData,
        abstract: newAbstract
      });
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
        response: newContent
      });
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
    
    setTimeout(() => {
      setHighlightPublish(false);
    }, 3000);
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (briefData && onSubmit) {
      onSubmit({ ...briefData, categoryIds: selectedCategoryIds });
    }
  };
  
  const colors = themeColors[theme];
  const activeProvider = selectedProvider ? PROVIDER_CONFIG.find(p => p.id === selectedProvider) : null;
  const providerThemeColors = activeProvider ? themeColors[activeProvider.theme] : null;

  // Provider picker (landing screen)
  const renderProviderPicker = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-center mb-6">Choose your AI platform</h2>
      <div className="grid grid-cols-2 gap-4">
        {PROVIDER_CONFIG.map((provider) => {
          const pColors = themeColors[provider.theme];
          return (
            <button
              key={provider.id}
              onClick={() => {
                setSelectedProvider(provider.id);
                setTheme(provider.theme);
              }}
              className={`text-left p-4 rounded-lg border-2 border-l-4 transition-all hover:shadow-md ${pColors.secondary} hover:bg-gray-50`}
            >
              <h3 className={`font-semibold ${pColors.tertiary}`}>{provider.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{provider.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Instruction panel for selected provider
  const renderInstructions = (provider: ProviderConfig) => {
    const pColors = themeColors[provider.theme];
    return (
      <div className="mb-4">
        <div className="flex gap-4">
          {provider.instructions.map((inst) => (
            <div key={inst.step} className={`flex-1 bg-white/90 backdrop-blur-sm rounded-lg border ${pColors.secondary} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-r ${pColors.flash}`}>
                  {inst.step}
                </span>
                <h4 className="font-semibold text-sm">{inst.title}</h4>
              </div>
              <div className="bg-gray-100 rounded-md h-[120px] flex items-center justify-center mb-2">
                <span className="text-xs text-gray-400">{inst.imagePlaceholder}</span>
              </div>
              <p className="text-xs text-gray-600">{inst.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Provider-specific input section
  const renderProviderInput = (provider: ProviderConfig) => {
    const pColors = themeColors[provider.theme];

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4">
        {/* Back link + provider name */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setSelectedProvider(null);
              setTheme(determineTheme(null));
              setClaudeWarning(null);
            }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to providers</span>
          </button>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${pColors.highlight} ${pColors.tertiary}`}>
            {provider.label}
          </span>
        </div>

        {/* URL input for URL-based providers */}
        {provider.uploadMethod === 'url' && (
          <>
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
                  placeholder={provider.urlPlaceholder || 'Paste research URL'}
                  className={`w-full p-2 pr-10 border rounded-md focus:ring-2 focus:outline-none ${
                    isValidUrl === true ? 'border-green-500 focus:ring-green-200' :
                    isValidUrl === false ? 'border-red-500 focus:ring-red-200' :
                    'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {isValidUrl === true && (
                  <CheckCircle className="absolute right-2 top-2 text-green-500" size={18} />
                )}
                {isValidUrl === false && (
                  <AlertCircle className="absolute right-2 top-2 text-red-500" size={18} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleFetchBrief}
                  disabled={!isValidUrl || isLoading}
                  className={`w-full text-white px-4 py-2 rounded-md transition-colors bg-gradient-to-r ${pColors.flash} hover:opacity-90 disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    "Fetch Brief"
                  )}
                </button>

                {briefData && (
                  <>
                    <button
                      onClick={handleClearForm}
                      className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Clear Form</span>
                    </button>

                    {briefData?.rawHtml && (
                      <button
                        onClick={() => setShowHtmlInspector(true)}
                        className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <CodeIcon size={16} />
                        <span>Inspect HTML</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* File upload for Claude */}
        {provider.uploadMethod === 'file' && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Research File
            </label>
            <FileDropzone
              onFileSelect={handleFileUpload}
              accept={provider.acceptedFiles || '.md,.markdown'}
              maxSize={5 * 1024 * 1024}
              label="Drop a file here or click to browse"
              description={`Supports ${provider.acceptedFiles || '.md'} files (max 5MB)`}
              isUploading={isLoading}
            />
            {claudeWarning && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700">{claudeWarning}</p>
              </div>
            )}
            {briefData && (
              <button
                onClick={handleClearForm}
                className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors mt-2"
              >
                <Trash2 size={16} />
                <span>Clear Form</span>
              </button>
            )}
          </>
        )}

        {/* Manual paste + file toggle for Other */}
        {provider.uploadMethod === 'manual' && (
          <>
            <div className="flex gap-2 mb-3 border-b border-gray-200">
              <button
                onClick={() => setOtherInputMode('manual')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  otherInputMode === 'manual'
                    ? `${pColors.tertiary} border-b-2 border-current`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Paste Content
              </button>
              <button
                onClick={() => setOtherInputMode('file')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  otherInputMode === 'file'
                    ? `${pColors.tertiary} border-b-2 border-current`
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                File Upload
              </button>
            </div>

            {otherInputMode === 'manual' && (
              <>
                <label htmlFor="manual-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Research Content
                </label>
                <div className="flex flex-col">
                  <textarea
                    id="manual-content"
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste your entire research content here...&#10;&#10;The parser will automatically extract:&#10;• Title (from first heading or line)&#10;• Prompt/Question (if labeled)&#10;• Main Content&#10;• Abstract/Conclusion (if labeled)&#10;• References (if labeled)&#10;• Source URLs (from links)"
                    className="w-full p-3 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 font-mono text-sm min-h-[300px] resize-y"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {manualContent.length} characters
                  </p>
                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      onClick={handleManualParse}
                      disabled={!manualContent.trim() || isLoading}
                      className={`w-full text-white px-4 py-2 rounded-md transition-colors bg-gradient-to-r ${pColors.flash} hover:opacity-90 disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin mx-auto" size={20} />
                      ) : (
                        "Parse Content"
                      )}
                    </button>

                    {briefData && (
                      <button
                        onClick={handleClearForm}
                        className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>Clear Form</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {otherInputMode === 'file' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Research File
                </label>
                <FileDropzone
                  onFileSelect={handleFileUpload}
                  accept={provider.acceptedFiles || '.html,.htm,.txt,.md,.markdown'}
                  maxSize={5 * 1024 * 1024}
                  label="Drop a file here or click to browse"
                  description="Supports .html, .txt, .md files (max 5MB)"
                  isUploading={isLoading}
                />
                {briefData && (
                  <button
                    onClick={handleClearForm}
                    className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors mt-2"
                  >
                    <Trash2 size={16} />
                    <span>Clear Form</span>
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  // Desktop sources section
  const renderDesktopSources = () => (
    <motion.div
      initial="hidden"
      animate={showSourcesSection ? "visible" : "hidden"}
      variants={sectionVariants}
      className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mt-4"
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
              <button className="mt-1 text-blue-600 hover:underline text-xs">Add Source</button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      <style>{customStyles}</style>
      <div className="px-4 py-8">
        {/* HTML Inspector Modal */}
        {briefData?.rawHtml && (
          <HtmlInspector
            html={briefData.rawHtml}
            isOpen={showHtmlInspector}
            onClose={() => setShowHtmlInspector(false)}
          />
        )}
      
      {/* Desktop Layout - Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Provider Picker - show when no provider selected and no brief data */}
        {!selectedProvider && !briefData && (
          <div className="col-span-8 col-start-3">
            {renderProviderPicker()}
            <ErrorPopup
              isVisible={!!error}
              message={error ?? ''}
              onClose={() => setError(null)}
              autoClose={true}
            />
          </div>
        )}

        {/* Provider selected but no brief data yet - instruction + input flow */}
        {selectedProvider && activeProvider && !briefData && (
          <div className="col-span-8 col-start-3">
            {renderInstructions(activeProvider)}
            {renderProviderInput(activeProvider)}
            <ErrorPopup
              isVisible={!!error}
              message={error ?? ''}
              onClose={() => setError(null)}
              autoClose={true}
            />
          </div>
        )}

        {/* After extraction - sidebar + content */}
        {briefData && (
          <motion.div
            className="col-span-3"
            variants={urlCardVariants}
            initial="center"
            animate="left"
          >
            {activeProvider ? renderProviderInput(activeProvider) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4">
                <button
                  onClick={handleClearForm}
                  className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Clear Form</span>
                </button>
              </div>
            )}

            {/* Show sources on desktop when brief data exists */}
            {showTitleSection && renderDesktopSources()}

            <ErrorPopup
              isVisible={!!error}
              message={error ?? ''}
              onClose={() => setError(null)}
              autoClose={true}
            />
          </motion.div>
        )}

        {/* Main Content Area - Desktop (only when brief data exists) */}
        {briefData && (
        <div className="col-span-9">
          {/* Brief Title Section */}
          <motion.div
            initial="hidden"
            animate={showTitleSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
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
          
          {/* Prompt Section */}
          <motion.div
            initial="hidden"
            animate={showPromptSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Research Prompt</h2>
              {!isPromptEditing && (
                <TooltipWrapper 
                  content="Edit the research prompt"
                  position="left"
                >
                  <button 
                    onClick={() => setIsPromptEditing(true)}
                    className={`hover:${colors.tertiary} p-1`}
                    aria-label="Edit prompt"
                  >
                    <Edit2 size={16} className={colors.tertiary} />
                  </button>
                </TooltipWrapper>
              )}
            </div>
            
            {isPromptEditing ? (
              <div>
                <textarea
                  defaultValue={briefData?.prompt ?? ""}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 min-h-[100px]"
                  onBlur={(e) => handlePromptEdit(e.target.value)}
                  autoFocus
                  placeholder="Enter the original research prompt or question..."
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{briefData?.prompt?.length ?? 0} characters</span>
                  <button 
                    onClick={() => setIsPromptEditing(false)}
                    className="text-blue-600 hover:underline"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize, rehypeRaw]}
                  components={markdownComponents}
                >
                  {briefData?.prompt ?? ""}
                </ReactMarkdown>
              </div>
            )}
          </motion.div>
          
          {/* Abstract Section */}
          <motion.div
            initial="hidden"
            animate={showAbstractSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
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
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 overflow-y-auto border ${colors.secondary}`}
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
                      defaultValue={briefData?.response ?? ""}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 min-h-[300px]"
                      onBlur={(e) => handleContentEdit(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{briefData?.response?.length ?? 0} characters</span>
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
                        {briefData?.response ?? "No content available"}
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
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
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
                {briefData?.references && briefData.references.length > 0 ? (
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
                    )) : (
                      <div className="p-2 border rounded-md border-gray-200 text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize, rehypeRaw]}
                          components={referenceComponents}
                        >
                          {briefData.references}
                        </ReactMarkdown>
                      </div>
                    )}
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
                )}
              </div>
            )}
          </motion.div>

          {/* Metadata Section */}
          <motion.div
            initial="hidden"
            animate={showMetadataSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
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
                <p className="mt-1">{briefData?.response?.split(' ').length ?? 0} words</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Sources:</span>
                <p className="mt-1">{briefData?.sources?.length ?? 0} sources</p>
              </div>
            </div>
          </motion.div>

          {/* Categories Section */}
          <motion.div
            initial="hidden"
            animate={showMetadataSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 border ${colors.secondary}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500" />
              <h2 className="text-lg font-semibold">Categories</h2>
              {isSuggestingCategories && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              )}
              {!isSuggestingCategories && suggestedCategoryIds.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Sparkles className="w-3 h-3" />
                  Auto-suggested
                </span>
              )}
            </div>

            {selectedCategoryIds.length >= 3 && (
              <p className="text-xs text-gray-500 mb-2">Maximum 3 categories selected</p>
            )}

            <div className="flex flex-wrap gap-2">
              {(categoriesQuery.data ?? []).map((cat: { id: string; name: string }) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                const isSuggested = suggestedCategoryIds.includes(cat.id);
                const isDisabled = !isSelected && selectedCategoryIds.length >= 3;

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isDisabled}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                        : isDisabled
                          ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {cat.name}
                    {isSelected && isSuggested && (
                      <Sparkles className="w-3 h-3 text-blue-500" />
                    )}
                    {isSelected && (
                      <X className="w-3 h-3 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {categoriesQuery.isLoading && (
              <p className="text-sm text-gray-400 mt-2">Loading categories...</p>
            )}
          </motion.div>

          {/* Bottom Controls */}
          <motion.div
  ref={bottomControlsRef}
  initial="hidden"
  animate={showMetadataSection ? "visible" : "hidden"}
  variants={sectionVariants}
  className="flex justify-center gap-4 mt-6"
>
  <button
    onClick={handleSubmit}
    disabled={!briefData || isSubmitting}
    className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${
      highlightPublish ? 'flash-gradient' : ''
    }`}
  >
    {isSubmitting && (
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
    )}
    {isSubmitting ? 'Publishing...' : 'Publish Brief'}
  </button>
</motion.div>
        </div>
        )}
      </div>

      {/* Add Reference Popup */}
      <AddReferencePopup
        isOpen={isAddReferenceOpen}
        onClose={() => setIsAddReferenceOpen(false)}
        onAddReference={handleAddReference}
        existingSources={briefData?.sources?.map(source => ({
          id: source.url,
          url: source.url,
          title: source.title,
          domain: new URL(source.url).hostname
        })) || []}
        briefContent={briefData?.response || ''}
        briefAbstract={briefData?.abstract || ''}
      />

      {/* Conversation Turn Selector */}
      {showTurnSelector && conversationTurns && (
        <ConversationTurnSelector
          turns={conversationTurns}
          onSelect={handleTurnSelect}
          onCancel={handleTurnSelectCancel}
        />
      )}
      </div>
    </>
  );
}
