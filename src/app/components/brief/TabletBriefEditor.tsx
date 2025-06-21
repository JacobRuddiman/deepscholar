// app/components/brief/TabletBriefEditor.tsx
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
  Eye,
  EyeOff,
  Clipboard,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import type { BriefData } from '@/functions/types';
import { extractBriefFromUrl } from '../extract_brief';
import ErrorPopup from '../error_popup';
import { markdownComponents, determineTheme, themeColors, urlSchema } from '../brief_editor_utils';

interface TabletBriefEditorProps {
  onSubmit?: (briefData: BriefData) => void;
  initialData?: BriefData;
  briefId?: string;
  isOwner?: boolean;
}

export default function TabletBriefEditor({ onSubmit, initialData, briefId, isOwner = false }: TabletBriefEditorProps) {
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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [expandedSections, setExpandedSections] = useState({
    title: true,
    abstract: true,
    content: true,
    sources: false,
    metadata: false
  });

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
    }
  }, [initialData]);

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
      
    } catch (error) {
      setError("Failed to fetch brief data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const colors = themeColors[theme];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {briefId ? 'Edit Brief' : 'Create Brief'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {briefId ? 'Make changes to your research brief' : 'Create a new research brief'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            )}
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* URL Input Section - Only show for new briefs */}
        {!briefId && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Research URL</h2>
            <div className="flex space-x-3">
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste research URL here..."
                className={`flex-1 p-3 border rounded-lg ${
                  isValidUrl === true ? 'border-green-500' :
                  isValidUrl === false ? 'border-red-500' :
                  'border-gray-300'
                }`}
              />
              <button
                onClick={handleClipboardPaste}
                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <Clipboard size={18} />
              </button>
              <button
                onClick={handleFetchBrief}
                disabled={!isValidUrl || isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Fetching...
                  </div>
                ) : (
                  "Fetch Brief"
                )}
              </button>
            </div>
          </div>
        )}

        {briefData && (
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-8 space-y-6">
              {/* Title Section */}
              <div className="bg-white rounded-lg shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection('title')}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
                  {expandedSections.title ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedSections.title && (
                  <div className="px-4 pb-4">
                    {activeTab === 'edit' ? (
                      <textarea
                        value={editingTitle}
                        onChange={(e) => {
                          setEditingTitle(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[80px] text-lg"
                        placeholder="Enter your brief title..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h1 className="text-xl font-bold text-gray-900">{editingTitle}</h1>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {editingTitle.length} characters
                    </div>
                  </div>
                )}
              </div>

              {/* Abstract Section */}
              <div className="bg-white rounded-lg shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection('abstract')}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Abstract</h2>
                  {expandedSections.abstract ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedSections.abstract && (
                  <div className="px-4 pb-4">
                    {activeTab === 'edit' ? (
                      <textarea
                        value={editingAbstract}
                        onChange={(e) => {
                          setEditingAbstract(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[120px]"
                        placeholder="Enter your abstract..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize, rehypeRaw]}
                          components={markdownComponents}
                        >
                          {editingAbstract}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {editingAbstract.length} characters
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="bg-white rounded-lg shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection('content')}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Content</h2>
                  {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedSections.content && (
                  <div className="px-4 pb-4">
                    {activeTab === 'edit' ? (
                      <textarea
                        value={editingContent}
                        onChange={(e) => {
                          setEditingContent(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg min-h-[400px] font-mono text-sm"
                        placeholder="Enter your research content..."
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg prose max-w-none max-h-96 overflow-y-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize, rehypeRaw]}
                          components={markdownComponents}
                        >
                          {editingContent}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {editingContent.split(' ').length} words, {editingContent.length} characters
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Sources */}
              <div className="bg-white rounded-lg shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection('sources')}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Sources</h2>
                  {expandedSections.sources ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedSections.sources && (
                  <div className="px-4 pb-4 space-y-3">
                    {briefData.sources && briefData.sources.length > 0 ? (
                      briefData.sources.map((source, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
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
                      <p className="text-gray-500 text-sm text-center py-4">
                        No sources found
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-white rounded-lg shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleSection('metadata')}
                >
                  <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
                  {expandedSections.metadata ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                
                {expandedSections.metadata && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Model:</span>
                      <span className="text-sm font-medium">{briefData.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Word Count:</span>
                      <span className="text-sm font-medium">{editingContent.split(' ').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sources:</span>
                      <span className="text-sm font-medium">{briefData.sources?.length || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                >
                  {briefId ? 'Update Brief' : 'Publish Brief'}
                </button>
              </div>
            </div>
          </div>
        )}
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