// app/components/brief/MobileBriefEditor.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  Save,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clipboard,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

import type { BriefData } from '@/functions/types';
import { extractBriefFromUrl } from '../../components/extract_brief'
import ErrorPopup from '../error_popup';
import { markdownComponents, determineTheme, themeColors, urlSchema } from '../brief_editor_utils';

interface MobileBriefEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
  briefId?: string;
  isOwner?: boolean;
}

type MobileStep = 'input' | 'title' | 'abstract' | 'content' | 'sources' | 'review';

const stepTitles = {
  input: 'URL Input',
  title: 'Title',
  abstract: 'Abstract',
  content: 'Content',
  sources: 'Sources',
  review: 'Review'
};

export default function MobileBriefEditor({ onSubmit, initialData, briefId, isOwner = false }: MobileBriefEditorProps) {
  const [currentStep, setCurrentStep] = useState<MobileStep>('input');
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(determineTheme(null));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Edit states
  const [editingTitle, setEditingTitle] = useState("");
  const [editingAbstract, setEditingAbstract] = useState("");
  const [editingContent, setEditingContent] = useState("");
  
  // UI states
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialData) {
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
      setEditingTitle(transformedData.title);
      setEditingAbstract(transformedData.abstract);
      setEditingContent(transformedData.content);
      setTheme(determineTheme(transformedData.model));
      setCurrentStep(briefId ? 'title' : 'input');
    }
  }, [initialData, briefId]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    try {
      urlSchema.parse(value);
      setIsValidUrl(true);
      setError(null);
    } catch {
      setIsValidUrl(value.length > 0 ? false : null);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (err) {
      setError("Failed to access clipboard");
    }
  };

  const handleFetchBrief = async () => {
    if (!isValidUrl) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await extractBriefFromUrl(url);
      setBriefData(data);
      setEditingTitle(data.title);
      setEditingAbstract(data.abstract);
      setEditingContent(data.content);
      setTheme(determineTheme(data.model));
      setCurrentStep('title');
      
    } catch (error) {
      setError("Failed to fetch brief data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    const steps: MobileStep[] = ['input', 'title', 'abstract', 'content', 'sources', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: MobileStep[] = ['input', 'title', 'abstract', 'content', 'sources', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = () => {
    if (briefData) {
      const updatedData = {
        ...briefData,
        title: editingTitle,
        abstract: editingAbstract,
        content: editingContent
      };
      setBriefData(updatedData);
      setHasUnsavedChanges(false);
    }
  };

  const handleSubmit = () => {
    if (briefData && onSubmit) {
      const finalData = {
        ...briefData,
        title: editingTitle,
        abstract: editingAbstract,
        content: editingContent
      };
      onSubmit(finalData);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'input': return briefData !== null;
      case 'title': return editingTitle.trim().length > 0;
      case 'abstract': return editingAbstract.trim().length > 0;
      case 'content': return editingContent.trim().length > 0;
      default: return true;
    }
  };

  const colors = themeColors[theme];

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-600"
          >
            {showMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-semibold">{stepTitles[currentStep]}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="p-2 text-blue-600"
            >
              <Save size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Step {['input', 'title', 'abstract', 'content', 'sources', 'review'].indexOf(currentStep) + 1} of 6
          </span>
          <div className="flex space-x-1">
            {['input', 'title', 'abstract', 'content', 'sources', 'review'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === currentStep ? 'bg-blue-600' : 
                  index < ['input', 'title', 'abstract', 'content', 'sources', 'review'].indexOf(currentStep) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* URL Input Step */}
        {currentStep === 'input' && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Research URL</h2>
              <p className="text-gray-600 text-sm">
                Paste a URL from OpenAI or Perplexity research
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 p-3 border rounded-lg text-sm ${
                    isValidUrl === true ? 'border-green-500' :
                    isValidUrl === false ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                />
                <button
                  onClick={handleClipboardPaste}
                  className="px-3 py-3 bg-gray-100 text-gray-600 rounded-lg"
                >
                  <Clipboard size={18} />
                </button>
              </div>
              
              <button
                onClick={handleFetchBrief}
                disabled={!isValidUrl || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Fetching...
                  </div>
                ) : (
                  "Fetch Brief"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Title Step */}
        {currentStep === 'title' && briefData && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Title</h2>
              <p className="text-gray-600 text-sm">
                Make sure your title is clear and descriptive
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Title
                </label>
                <textarea
                  value={editingTitle}
                  onChange={(e) => {
                    setEditingTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[80px]"
                  placeholder="Enter your brief title..."
                />
                <div className="mt-1 text-xs text-gray-500">
                  {editingTitle.length}/200 characters
                </div>
              </div>
              
              {editingTitle && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-gray-500"
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showPreview && (
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingTitle}
                    </h3>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Abstract Step */}
        {currentStep === 'abstract' && briefData && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Abstract</h2>
              <p className="text-gray-600 text-sm">
                Summarize the key points and conclusions
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abstract/Summary
                </label>
                <textarea
                  value={editingAbstract}
                  onChange={(e) => {
                    setEditingAbstract(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[120px]"
                  placeholder="Enter your abstract..."
                />
                <div className="mt-1 text-xs text-gray-500">
                  {editingAbstract.length} characters
                </div>
              </div>
              
              {editingAbstract && showPreview && (
                <div className="bg-gray-50 p-3 rounded-lg prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize, rehypeRaw]}
                    components={markdownComponents}
                  >
                    {editingAbstract}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Step */}
        {currentStep === 'content' && briefData && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Content</h2>
              <p className="text-gray-600 text-sm">
                Review and edit the main research content
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Research Content
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-1 text-sm text-gray-600"
                  >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
                
                {showPreview ? (
                  <div className="bg-gray-50 p-3 rounded-lg prose prose-sm max-w-none min-h-[300px] overflow-y-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {editingContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editingContent}
                    onChange={(e) => {
                      setEditingContent(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm min-h-[300px]"
                    placeholder="Enter your research content..."
                  />
                )}
                
                <div className="mt-1 text-xs text-gray-500">
                  {editingContent.split(' ').length} words, {editingContent.length} characters
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sources Step */}
        {currentStep === 'sources' && briefData && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sources</h2>
              <p className="text-gray-600 text-sm">
                Review the sources used in this research
              </p>
            </div>
            
            <div className="space-y-3">
              {briefData.sources && briefData.sources.length > 0 ? (
                briefData.sources.map((source, index) => (
                  <div key={index} className="bg-white p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {source.title}
                    </h4>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs block truncate"
                    >
                      {source.url}
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No sources found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && briefData && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Publish</h2>
              <p className="text-gray-600 text-sm">
                Review your brief before publishing
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">Title</h3>
                <p className="text-gray-900">{editingTitle}</p>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">Abstract</h3>
                <p className="text-gray-900 text-sm line-clamp-3">{editingAbstract}</p>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 text-sm mb-2">Content</h3>
                <p className="text-gray-600 text-sm">
                  {editingContent.split(' ').length} words, {briefData.sources?.length || 0} sources
                </p>
              </div>
              
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg"
              >
                {briefId ? 'Update Brief' : 'Publish Brief'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 'input' || (currentStep === 'title' && !briefId)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 disabled:text-gray-400"
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed() || currentStep === 'review'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Error Popup */}
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
      />
    </div>
  );
}