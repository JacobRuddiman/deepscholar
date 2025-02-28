"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
  Code as CodeIcon 
} from "lucide-react";
import { GiConsoleController } from "react-icons/gi";

import { extractBriefFromUrl } from '../components/extract_brief';
import type { BriefData } from '../components/extract_brief';
import HtmlInspector from '../components/html_inspector';

// Define a schema for URL validation
const urlSchema = z.string().url("Please enter a valid URL");

async function fetchBriefFromUrl(url: string): Promise<BriefData> {
  try {
    // Call the server action to extract brief data
    return await extractBriefFromUrl(url);
  } catch (error) {
    console.error("Error fetching brief:", error);
    throw new Error("Failed to fetch brief data. Please check the URL and try again.");
  }
}

// Markdown components configuration for consistent styling
const markdownComponents = {
  h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
  h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
  h5: ({node, ...props}) => <h5 className="text-sm font-bold my-2" {...props} />,
  h6: ({node, ...props}) => <h6 className="text-xs font-bold my-2" {...props} />,
  p: ({node, ...props}) => <p className="text-gray-800 my-2" {...props} />,
  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3" {...props} />,
  li: ({node, ...props}) => <li className="my-1" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3" {...props} />,
  code: ({node, inline, ...props}) => 
    inline 
      ? <code className="bg-gray-100 px-1 rounded" {...props} />
      : <code className="block bg-gray-100 p-2 rounded my-3 overflow-x-auto" {...props} />,
  pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props} />,
  table: ({node, ...props}) => <table className="border-collapse table-auto w-full my-3" {...props} />,
  thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
  tbody: ({node, ...props}) => <tbody {...props} />,
  tr: ({node, ...props}) => <tr className="border-b border-gray-200" {...props} />,
  th: ({node, ...props}) => <th className="p-2 text-left font-bold" {...props} />,
  td: ({node, ...props}) => <td className="p-2" {...props} />
};

// Title-specific components that render the title as a span
const titleComponents = {
  p: ({node, ...props}) => <span className="text-xl font-bold" {...props} />
};

// Reference-specific components
const referenceComponents = {
  p: ({node, ...props}) => <p className="text-sm text-gray-700 whitespace-pre-wrap" {...props} />,
  a: ({node, ...props}) => <a className="text-blue-600 hover:underline text-sm" {...props} />
};

// Thinking-specific components
const thinkingComponents = {
  p: ({node, ...props}) => <p className="text-gray-700 text-sm" {...props} />,
  pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto text-sm" {...props} />,
  code: ({node, inline, ...props}) => 
    inline 
      ? <code className="bg-gray-100 px-1 rounded text-sm" {...props} />
      : <code className="block bg-gray-100 p-2 rounded my-2 overflow-x-auto text-sm" {...props} />
};

export default function BriefUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State variables
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [showHtmlInspector, setShowHtmlInspector] = useState(false);
  
  // Section visibility state
  const [showTitleSection, setShowTitleSection] = useState(false);
  const [showAbstractSection, setShowAbstractSection] = useState(false);
  const [showContentSection, setShowContentSection] = useState(false);
  const [showSourcesSection, setShowSourcesSection] = useState(false);
  const [showReferencesSection, setShowReferencesSection] = useState(false);
  const [showThinkingSection, setShowThinkingSection] = useState(false);
  const [showMetadataSection, setShowMetadataSection] = useState(false);
  
  // Toggle states for collapsible sections
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(true);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  
  // Edit mode states
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isAbstractEditing, setIsAbstractEditing] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  
  // Refs for section elements to enable smooth scrolling
  const titleSectionRef = useRef<HTMLDivElement>(null);
  const abstractSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const sourcesSectionRef = useRef<HTMLDivElement>(null);
  const referencesSectionRef = useRef<HTMLDivElement>(null);
  const thinkingSectionRef = useRef<HTMLDivElement>(null);
  
  // Animation variants for sliding sections
  const sectionVariants = {
    hidden: { opacity: 0, y: -20, height: 0, overflow: "hidden" },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: "auto",
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // URL input card animation variants
  const urlCardVariants = {
    center: { 
      x: 0, 
      width: "100%",
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    left: { 
      x: 0, 
      width: "100%",
      transition: { duration: 0.5, ease: "easeInOut" }
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
      
      // Reveal sections sequentially with delays
      setShowTitleSection(true);
      setTimeout(() => setShowAbstractSection(true), 200);
      setTimeout(() => setShowContentSection(true), 400);
      setTimeout(() => setShowSourcesSection(true), 600);
      setTimeout(() => setShowReferencesSection(true), 700);
      setTimeout(() => setShowThinkingSection(true), 900);
      setTimeout(() => setShowMetadataSection(true), 1100);
      
    } catch (error) {
      console.error("Error fetching brief:", error);
      setError("Failed to fetch brief data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
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
    }
    setIsContentEditing(false);
  };
  
  // Handle submit
  const handleSubmit = () => {
    // This would be implemented to save the brief to your database
    console.log("Submitting brief:", briefData);
    // Redirect to the brief page or show success message
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col relative">
      {/* HTML Inspector Modal */}
      {briefData?.rawHtml && (
        <HtmlInspector
          html={briefData.rawHtml}
          isOpen={showHtmlInspector}
          onClose={() => setShowHtmlInspector(false)}
        />
      )}
      
      <h1 className="text-3xl font-bold text-center my-6">Upload Research Brief</h1>
      
      <div className={`flex-grow flex flex-col ${showTitleSection ? 'justify-start' : 'justify-center'}`}>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* URL Input Section - Initially centered, moves to left column when brief is loaded */}
          <motion.div
            className={`${showTitleSection ? 'col-span-3' : 'col-span-8 col-start-3'}`}
            variants={urlCardVariants}
            initial="center"
            animate={showTitleSection ? "left" : "center"}
          >
            <div className="bg-white rounded-lg shadow-md p-4">
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
                  {briefData?.rawHtml && (
                    <button
                      onClick={() => setShowHtmlInspector(true)}
                      className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <CodeIcon size={16} />
                      <span>Inspect HTML</span>
                    </button>
                  )}
                </div>
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {!showTitleSection && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Supports OpenAI and Perplexity deep research URLs
                </p>
              )}
            </div>
            
            {/* Sources Section - Appears below URL in left column */}
            <motion.div
              ref={sourcesSectionRef}
              initial="hidden"
              animate={showSourcesSection ? "visible" : "hidden"}
              variants={sectionVariants}
              className="bg-white rounded-lg shadow-md p-4 mt-6 h-full"
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
                <div className="mt-3 h-full">
                  {briefData?.sources && briefData.sources.length > 0 ? (
                    <ul className="space-y-2 max-h-full overflow-y-auto">
                      {briefData.sources.map((source, index) => (
                        <li key={index} className="flex items-start p-2 border rounded-md border-gray-200 text-sm">
                          <Link className="text-gray-500 mt-1 mr-2 flex-shrink-0" size={14} />
                          <div className="flex-1">
                            <p className="font-medium">{source.title}</p>
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline break-words"
                            >
                              {source.url}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-3 text-center text-gray-500 text-sm">
                      <p>No sources found.</p>
                      <button className="mt-1 text-blue-600 hover:underline text-xs">Add Source</button>
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
              ref={titleSectionRef}
              initial="hidden"
              animate={showTitleSection ? "visible" : "hidden"}
              variants={sectionVariants}
              className="bg-white rounded-lg shadow-md p-4 mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Brief Title</h2>
                {briefData?.model && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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
                  <button 
                    onClick={() => setIsTitleEditing(true)}
                    className="text-gray-500 hover:text-blue-600 p-1"
                    aria-label="Edit title"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
            
            {/* Abstract Section */}
            <motion.div
              ref={abstractSectionRef}
              initial="hidden"
              animate={showAbstractSection ? "visible" : "hidden"}
              variants={sectionVariants}
              className="bg-white rounded-lg shadow-md p-4 mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Abstract/Conclusion</h2>
                {!isAbstractEditing && (
                  <button 
                    onClick={() => setIsAbstractEditing(true)}
                    className="text-gray-500 hover:text-blue-600 p-1"
                    aria-label="Edit abstract"
                  >
                    <Edit2 size={16} />
                  </button>
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize, rehypeRaw]}
                    components={markdownComponents}
                  >
                    {briefData?.abstract ?? "No abstract available"}
                  </ReactMarkdown>
                </div>
              )}
            </motion.div>
            
            {/* Brief Content Section */}
            <motion.div
              ref={contentSectionRef}
              initial="hidden"
              animate={showContentSection ? "visible" : "hidden"}
              variants={sectionVariants}
              className="bg-white rounded-lg shadow-md p-4 mb-4"
              style={{ maxHeight: "calc(100vh - 450px)", overflowY: "auto" }}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Research Summary</h2>
                {!isContentEditing && (
                  <button 
                    onClick={() => setIsContentEditing(true)}
                    className="text-gray-500 hover:text-blue-600 p-1"
                    aria-label="Edit content"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize, rehypeRaw]}
                    components={markdownComponents}
                  >
                    {briefData?.content ?? "No content available"}
                  </ReactMarkdown>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Sections (Full Width) */}
        <div className="mt-4">
          {/* References Section */}
          <motion.div
            ref={referencesSectionRef}
            initial="hidden"
            animate={showReferencesSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className="bg-white rounded-lg shadow-md p-4 mb-4"
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
                {briefData?.references ? (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize, rehypeRaw]}
                      components={referenceComponents}
                    >
                      {briefData.references}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="py-3 text-center text-gray-500 text-sm">
                    <p>No references available.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* AI Thinking Section */}
          <motion.div
            ref={thinkingSectionRef}
            initial="hidden"
            animate={showThinkingSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className="bg-white rounded-lg shadow-md p-4 mb-4"
          >
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            >
              <h2 className="text-lg font-semibold">AI Thinking Process</h2>
              <button className="text-gray-500 p-1" aria-label="Toggle thinking process">
                {isThinkingExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            
            {isThinkingExpanded && (
              <div className="mt-3">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-80 overflow-y-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize, rehypeRaw]}
                    components={thinkingComponents}
                  >
                    {briefData?.thinking ?? "No thinking process available"}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Metadata Section */}
          <motion.div
            initial="hidden"
            animate={showMetadataSection ? "visible" : "hidden"}
            variants={sectionVariants}
            className="bg-white rounded-lg shadow-md p-4 mb-4"
          >
            <h2 className="text-lg font-semibold mb-3">Additional Metadata</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                </label>
                <select 
                  id="categories" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:outline-none"
                >
                  <option value="">Select a category</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="ai-ml">AI & Machine Learning</option>
                  <option value="physics">Physics</option>
                  <option value="biology">Biology</option>
                  <option value="medicine">Medicine</option>
                  <option value="economics">Economics</option>
                  <option value="social-sciences">Social Sciences</option>
                </select>
              </div>
              
              {/* Tags section removed as requested */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="visibility-public" 
                      name="visibility" 
                      value="public" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                      defaultChecked 
                    />
                    <label htmlFor="visibility-public" className="ml-2 text-sm text-gray-700">
                      Public
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="visibility-private" 
                      name="visibility" 
                      value="private" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="visibility-private" className="ml-2 text-sm text-gray-700">
                      Private
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Submission Controls */}
        <motion.div
          initial="hidden"
          animate={showMetadataSection ? "visible" : "hidden"}
          variants={sectionVariants}
          className="flex justify-end gap-4 mb-6"
        >
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Publish Brief
          </button>
        </motion.div>
      </div>
    </div>
  );
}