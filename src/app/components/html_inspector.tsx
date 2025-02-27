'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface HtmlInspectorProps {
  html: string;
  isOpen: boolean;
  onClose: () => void;
}

const HtmlInspector: React.FC<HtmlInspectorProps> = ({ html, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    head: false,
    body: true,
    scripts: false
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Parse HTML to get separate sections
  const getSection = (html: string, tag: string) => {
    const startRegex = new RegExp(`<${tag}[^>]*>`, 'i');
    const endRegex = new RegExp(`</${tag}>`, 'i');
    
    const startMatch = html.match(startRegex);
    const endMatch = html.match(endRegex);
    
    if (startMatch && endMatch) {
      const startIndex = startMatch.index || 0;
      const endIndex = endMatch.index || 0;
      if (endIndex > startIndex) {
        return html.substring(startIndex, endIndex + endMatch[0].length);
      }
    }
    
    return '';
  };

  const headSection = getSection(html, 'head');
  const bodySection = getSection(html, 'body');
  
  // Extract scripts for separate section
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const scripts: string[] = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[0]);
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatHtml = (html: string) => {
    // Improved HTML formatting with indentation and syntax highlighting
    let indentLevel = 0;
    const indentSize = 2;
    
    return html
      .replace(/></g, '>\n<') // Add newlines between tags
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Decrease indent for closing tags
        if (line.match(/^<\//)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add proper indentation
        const indent = ' '.repeat(indentLevel * indentSize);
        const formattedLine = indent + line
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          // Add syntax highlighting
          .replace(/&lt;(\/?[a-zA-Z][^\s&>]*)/g, '<span class="text-pink-400">&lt;$1</span>') // Tag names
          .replace(/([a-zA-Z-]+)=/g, '<span class="text-sky-300">$1</span>=') // Attributes
          .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>'); // Attribute values
        
        // Increase indent for opening tags (not self-closing)
        if (line.match(/^<[^/][^>]*>$/) && !line.match(/\/>$/)) {
          indentLevel++;
        }
        
        return (
          <div key={Math.random()} className="html-line hover:bg-gray-800">
            <span className="line-number">{indentLevel}</span>
            <span className="line-content" dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </div>
        );
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-3/4 h-3/4 max-w-4xl max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">HTML Inspector</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(html)}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700 flex items-center gap-1"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy All'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary section */}
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-medium">HTML Overview</h3>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Size</p>
                <p className="font-medium">{(html.length / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <p className="text-gray-500">Head Size</p>
                <p className="font-medium">{(headSection.length / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <p className="text-gray-500">Scripts</p>
                <p className="font-medium">{scripts.length} found</p>
              </div>
            </div>
          </div>
          
          {/* Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
            {/* Head Section */}
            <div className="rounded-lg border bg-white overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer border-b" 
                onClick={() => toggleSection('head')}
              >
                <h3 className="font-medium">HEAD Section</h3>
                <button>
                  {expandedSections.head ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {expandedSections.head && (
                <div className="p-3 overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                  <pre className="font-mono">
                    {formatHtml(headSection)}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Body Section */}
            <div className="rounded-lg border bg-white overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer border-b" 
                onClick={() => toggleSection('body')}
              >
                <h3 className="font-medium">BODY Section</h3>
                <button>
                  {expandedSections.body ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {expandedSections.body && (
                <div className="p-3 overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                  <pre className="font-mono">
                    {formatHtml(bodySection)}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Scripts Section */}
            <div className="rounded-lg border bg-white overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer border-b" 
                onClick={() => toggleSection('scripts')}
              >
                <h3 className="font-medium">Scripts ({scripts.length})</h3>
                <button>
                  {expandedSections.scripts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {expandedSections.scripts && (
                <div className="p-3 overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                  <pre className="font-mono">
                    {scripts.map((script, index) => (
                      <div key={index} className="mb-4 pb-4 border-b border-gray-700">
                        <div className="font-bold text-blue-400 mb-2">Script {index + 1}</div>
                        {formatHtml(script)}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .html-line {
          display: flex;
          width: 100%;
        }
        .line-number {
          min-width: 3rem;
          padding-right: 1rem;
          text-align: right;
          color: #6b7280;
          user-select: none;
        }
        .line-content {
          white-space: pre;
        }
      `}</style>
    </div>
  );
};

export default HtmlInspector;