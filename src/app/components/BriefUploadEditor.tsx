// components/brief/BriefUploadEditor.tsx
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
import TooltipWrapper from './TooltipWrapper';
import AddReferencePopup from './AddReferencePopup';

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

interface BriefUploadEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
}

export default function BriefUploadEditor({ onSubmit, initialData }: BriefUploadEditorProps) {
  // State variables
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [showHtmlInspector, setShowHtmlInspector] = useState(false);
  
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
  
  // Refs
  const bottomControlsRef = useRef<HTMLDivElement>(null);
  
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

  // Reference management state
  const [isAddReferenceOpen, setIsAddReferenceOpen] = useState(false);

  // Handle adding a new reference
  const handleAddReference = async (url: string, highlightedText: string) => {
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
  };

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
          ? ((initialData as any).model?.name as "openai" | "perplexity" | "anthropic" | "other") || 'other'
          : (initialData.model as "openai" | "perplexity" | "anthropic" | "other") || 'other',
        sources: (initialData as any).sources || [],
        references: (initialData as any).references || '',
        rawHtml: (initialData as any).rawHtml
      };

      setBriefData(transformedData);
      setOriginalAbstract(transformedData.abstract || "");
      setOriginalContent(transformedData.content || "");
      setShowTitleSection(true);
      setShowAbstractSection(true);
      setShowContentSection(true);
      setShowSourcesSection(true);
      setShowReferencesSection(true);
      setShowMetadataSection(true);
      setTheme(determineTheme(transformedData.model));
    }
  }, [initialData]);

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
  
  // Handle submit
  const handleSubmit = () => {
    if (briefData && onSubmit) {
      onSubmit(briefData);
    }
  };
  
  // Get current theme color set
  const colors = themeColors[theme];
  
  return (
    <>
      <style>{customStyles}</style>
      <div className="relative min-h-screen">
        {/* Background gradient that covers full height */}
        <div className={`fixed inset-0 bg-gradient-to-b ${colors.primary} pointer-events-none z-0`} />
        
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
            Upload Research Brief
          </h1>
          
          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* URL Input Section */}
            <motion.div
              className={`${showTitleSection ? 'col-span-3' : 'col-span-8 col-start-3'}`}
              variants={urlCardVariants}
              initial="center"
              animate={showTitleSection ? "left" : "center"}
            >
              {/* URL Input */}
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
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mt-6"
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
                <button
                  onClick={handleSubmit}
                  disabled={!briefData}
                  className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors ${
                    highlightPublish ? 'flash-gradient' : ''
                  }`}
                >
                  Publish Brief
                </button>
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
