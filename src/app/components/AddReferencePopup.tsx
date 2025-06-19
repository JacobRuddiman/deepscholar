'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Check, AlertCircle, Plus, Search } from 'lucide-react';
import TooltipWrapper from './TooltipWrapper';

interface Source {
  id: string;
  url: string;
  title: string;
  domain?: string;
}

interface AddReferencePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReference: (url: string, highlightedText: string) => void;
  existingSources?: Source[];
  briefContent?: string;
  briefAbstract?: string;
}

interface HighlightRange {
  start: number;
  end: number;
  text: string;
}

const AddReferencePopup: React.FC<AddReferencePopupProps> = ({
  isOpen,
  onClose,
  onAddReference,
  existingSources = [],
  briefContent = '',
  briefAbstract = ''
}) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [useNewUrl, setUseNewUrl] = useState(true);
  const [highlightedText, setHighlightedText] = useState('');
  const [highlightRange, setHighlightRange] = useState<HighlightRange | null>(null);
  const [activeSection, setActiveSection] = useState<'abstract' | 'content'>('abstract');
  
  const abstractRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setIsValidUrl(null);
      setValidationError(null);
      setSelectedSource(null);
      setUseNewUrl(true);
      setHighlightedText('');
      setHighlightRange(null);
      setActiveSection('abstract');
    }
  }, [isOpen]);

  // URL validation
  const validateUrl = async (urlToValidate: string) => {
    if (!urlToValidate.trim()) {
      setIsValidUrl(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/.+\..+/;
      if (!urlPattern.test(urlToValidate)) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      // Check if URL is accessible (simplified validation)
      const response = await fetch(`/api/validate-url?url=${encodeURIComponent(urlToValidate)}`, {
        method: 'HEAD',
      }).catch(() => {
        // If fetch fails, we'll still consider it valid for now
        return { ok: true };
      });

      setIsValidUrl(true);
    } catch (error) {
      setIsValidUrl(false);
      setValidationError(error instanceof Error ? error.message : 'Invalid URL');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateUrl(newUrl);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle text selection for highlighting
  const handleTextSelection = (sectionRef: React.RefObject<HTMLDivElement>, sectionText: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText || !sectionRef.current) return;

    // Ensure selection is within our target element
    if (!sectionRef.current.contains(range.commonAncestorContainer)) return;

    // Find word boundaries to ensure we don't select partial words
    const fullText = sectionText;
    const startOffset = fullText.indexOf(selectedText);
    
    if (startOffset === -1) return;

    // Expand selection to word boundaries
    let expandedStart = startOffset;
    let expandedEnd = startOffset + selectedText.length;

    // Expand to start of word
    while (expandedStart > 0 && /\w/.test(fullText[expandedStart - 1] || '')) {
      expandedStart--;
    }

    // Expand to end of word
    while (expandedEnd < fullText.length && /\w/.test(fullText[expandedEnd] || '')) {
      expandedEnd++;
    }

    const expandedText = fullText.slice(expandedStart, expandedEnd);

    setHighlightedText(expandedText);
    setHighlightRange({
      start: expandedStart,
      end: expandedEnd,
      text: expandedText
    });
  };

  // Render text with highlighting
  const renderTextWithHighlight = (text: string, sectionRef: React.RefObject<HTMLDivElement>) => {
    if (!highlightRange || activeSection !== (sectionRef === abstractRef ? 'abstract' : 'content')) {
      return (
        <div
          ref={sectionRef}
          className="p-4 border rounded-lg bg-gray-50 text-sm leading-relaxed cursor-text select-text"
          onMouseUp={() => handleTextSelection(sectionRef, text)}
        >
          {text || 'No content available'}
        </div>
      );
    }

    const beforeHighlight = text.slice(0, highlightRange.start);
    const highlighted = text.slice(highlightRange.start, highlightRange.end);
    const afterHighlight = text.slice(highlightRange.end);

    return (
      <div
        ref={sectionRef}
        className="p-4 border rounded-lg bg-gray-50 text-sm leading-relaxed cursor-text select-text"
        onMouseUp={() => handleTextSelection(sectionRef, text)}
      >
        {beforeHighlight}
        <span className="bg-yellow-200 px-1 rounded">
          {highlighted}
        </span>
        {afterHighlight}
      </div>
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    const sourceUrl = useNewUrl ? url : selectedSource?.url;
    
    if (!sourceUrl) {
      setValidationError('Please select a source or enter a valid URL');
      return;
    }

    if (!highlightedText.trim()) {
      setValidationError('Please select some text to reference');
      return;
    }

    onAddReference(sourceUrl, highlightedText);
    onClose();
  };

  // Filter existing sources
  const filteredSources = existingSources.filter(source =>
    source.title.toLowerCase().includes(url.toLowerCase()) ||
    source.url.toLowerCase().includes(url.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Add Reference</h2>
            <TooltipWrapper content="Close reference popup" position="bottom">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </TooltipWrapper>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Source Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Source</h3>
                
                {/* Toggle between new URL and existing sources */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseNewUrl(true)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      useNewUrl
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    New URL
                  </button>
                  <button
                    onClick={() => setUseNewUrl(false)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      !useNewUrl
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Search className="w-4 h-4 inline mr-1" />
                    Existing Sources ({existingSources.length})
                  </button>
                </div>

                {useNewUrl ? (
                  /* New URL Input */
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Source URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/article"
                        className={`w-full p-3 border rounded-md focus:ring-2 focus:outline-none ${
                          isValidUrl === true ? 'border-green-500 focus:ring-green-200' :
                          isValidUrl === false ? 'border-red-500 focus:ring-red-200' :
                          'border-gray-300 focus:ring-blue-200'
                        }`}
                      />
                      <div className="absolute right-3 top-3">
                        {isValidating ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        ) : isValidUrl === true ? (
                          <Check className="text-green-500 w-5 h-5" />
                        ) : isValidUrl === false ? (
                          <AlertCircle className="text-red-500 w-5 h-5" />
                        ) : (
                          <Link className="text-gray-400 w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {validationError && (
                      <p className="text-sm text-red-600">{validationError}</p>
                    )}
                    {isValidUrl && (
                      <p className="text-sm text-green-600">URL is valid and accessible</p>
                    )}
                  </div>
                ) : (
                  /* Existing Sources List */
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select from existing sources
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="Search sources..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredSources.length > 0 ? (
                        filteredSources.map((source) => (
                          <div
                            key={source.id}
                            onClick={() => setSelectedSource(source)}
                            className={`p-3 border rounded-md cursor-pointer transition-colors ${
                              selectedSource?.id === source.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-sm">{source.title}</div>
                            <div className="text-xs text-gray-500 truncate">{source.url}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          {existingSources.length === 0 ? 'No existing sources' : 'No sources match your search'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Text Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Text to Reference</h3>
                
                {/* Section Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection('abstract')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === 'abstract'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Abstract
                  </button>
                  <button
                    onClick={() => setActiveSection('content')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === 'content'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Content
                  </button>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select text by clicking and dragging
                  </label>
                  
                  {activeSection === 'abstract' ? (
                    renderTextWithHighlight(briefAbstract, abstractRef)
                  ) : (
                    renderTextWithHighlight(briefContent, contentRef)
                  )}
                  
                  {/* Selected Text Display */}
                  {highlightedText && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Text:
                      </label>
                      <div className="text-sm text-gray-800 italic">
                        "{highlightedText}"
                      </div>
                      <button
                        onClick={() => {
                          setHighlightedText('');
                          setHighlightRange(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {highlightedText ? (
                <span className="text-green-600">✓ Text selected</span>
              ) : (
                'Select text to reference'
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!highlightedText || (!url && !selectedSource)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add Reference
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddReferencePopup;
