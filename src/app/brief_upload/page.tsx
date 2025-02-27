"use client";

import React, { useState, useRef } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Edit2, Link } from "lucide-react";

// Define a schema for URL validation
const urlSchema = z.string().url("Please enter a valid URL");

// Define types for the brief data
type BriefSource = {
  title: string;
  url: string;
  author?: string;
  date?: string;
};

type BriefData = {
  title: string;
  content: string;
  sources: BriefSource[];
  thinking: string;
  model: "OpenAI" | "Perplexity" | "Anthropic" | "Other";
};

// Server action placeholder - this would be imported from a separate file
async function fetchBriefFromUrl(url: string): Promise<BriefData> {
  // This is a placeholder. In a real implementation, this would be a server action
  // that fetches the brief data from the provided URL
  console.log("Fetching brief from URL:", url);
  
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock data
  return {
    title: "The Impact of Quantum Computing on Modern Cryptography",
    content: "Quantum computing poses significant challenges to current cryptographic methods...",
    sources: [
      { title: "Quantum Computing and Cryptography", url: "https://example.com/quantum1" },
      { title: "Post-Quantum Cryptographic Standards", url: "https://example.com/pqc-standards" }
    ],
    thinking: "The analysis began by examining the fundamental principles of quantum computing...",
    model: "OpenAI"
  };
}

export default function BriefUploadPage() {
  // State variables
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  
  // Section visibility state
  const [showTitleSection, setShowTitleSection] = useState(false);
  const [showContentSection, setShowContentSection] = useState(false);
  const [showSourcesSection, setShowSourcesSection] = useState(false);
  const [showThinkingSection, setShowThinkingSection] = useState(false);
  const [showMetadataSection, setShowMetadataSection] = useState(false);
  
  // Toggle states for collapsible sections
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  
  // Edit mode states
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isContentEditing, setIsContentEditing] = useState(false);
  
  // Refs for section elements to enable smooth scrolling
  const titleSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const sourcesSectionRef = useRef<HTMLDivElement>(null);
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
      setTimeout(() => setShowContentSection(true), 300);
      setTimeout(() => setShowSourcesSection(true), 600);
      setTimeout(() => setShowThinkingSection(true), 900);
      setTimeout(() => setShowMetadataSection(true), 1200);
      
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
    <div className="container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col">
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
                <button className="text-gray-500 p-1">
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
                    {briefData?.title.length ?? 0}/100 characters
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{briefData?.title ?? "Untitled Brief"}</h3>
                  <button 
                    onClick={() => setIsTitleEditing(true)}
                    className="text-gray-500 hover:text-blue-600 p-1"
                  >
                    <Edit2 size={16} />
                  </button>
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
              style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Research Summary</h2>
                {!isContentEditing && (
                  <button 
                    onClick={() => setIsContentEditing(true)}
                    className="text-gray-500 hover:text-blue-600 p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              {isContentEditing ? (
                <div>
                  <textarea
                    defaultValue={briefData?.content ?? ""}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:outline-none border-gray-300 focus:ring-blue-200 min-h-[200px]"
                    onBlur={(e) => handleContentEdit(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{briefData?.content.length ?? 0} characters</span>
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
                  <p>{briefData?.content ?? "No content available"}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Sections (Full Width) */}
                  <div className="mt-4">
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
              <button className="text-gray-500 p-1">
                {isThinkingExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            
            {isThinkingExpanded && (
              <div className="mt-3">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-80 overflow-y-auto">
                  <p className="text-gray-700 text-sm whitespace-pre-line">
                    {briefData?.thinking ?? "No thinking process available"}
                  </p>
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