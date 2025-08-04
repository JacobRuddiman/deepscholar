'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Copy, Check, Download, Maximize2, Minimize2, List, Hash, Code, FileText } from 'lucide-react';

interface HtmlInspectorProps {
  html: string;
  isOpen: boolean;
  onClose: () => void;
}

const HtmlInspector: React.FC<HtmlInspectorProps> = ({ html, isOpen, onClose }) => {
  // State declarations - keep all hooks at the top level
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    fullHtml: true,
    head: false,
    body: true,
    scripts: false
  });
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [indentSize, setIndentSize] = useState(2);
  const [activeTab, setActiveTab] = useState<'full' | 'head' | 'body' | 'scripts'>('full');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const [fullOutline, setFullOutline] = useState<Array<{tag: string, line: number, indent: number, preview: string, type: string}>>([]);
  const [headOutline, setHeadOutline] = useState<Array<{tag: string, line: number, indent: number, preview: string, type: string}>>([]);
  const [bodyOutline, setBodyOutline] = useState<Array<{tag: string, line: number, indent: number, preview: string, type: string}>>([]);
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const fullPreRef = useRef<HTMLPreElement>(null);
  const headPreRef = useRef<HTMLPreElement>(null);
  const bodyPreRef = useRef<HTMLPreElement>(null);

  // Add logging to check HTML content
  useEffect(() => {
    if (html) {
      console.log(`Total HTML length: ${html.length}`);
      console.log(`Last 100 characters: ${html.slice(-100)}`);
      console.log(`Total lines: ${html.split('\n').length}`);
    }
  }, [html]);

  // Split the HTML into sections
  const sections = useMemo(() => {
    if (!html) return { head: '', body: '', scripts: [] };
    
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
    
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const scripts: string[] = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push(match[0]);
    }

    return { head: headSection, body: bodySection, scripts };
  }, [html]);

  // Helper function to generate outline from HTML content
  const generateOutline = useCallback((htmlContent: string, offset = 0) => {
    if (!htmlContent) return [];
    
    const lines = htmlContent.split('\n');
    const outlineItems: Array<{tag: string, line: number, indent: number, preview: string, type: string}> = [];
    
    // Match different kinds of interesting elements
    const headingRegex = /<(h[1-6])(?:[^>]*?)>(.*?)<\/\1>/i;
    const divWithIdRegex = /<(div|section|article|nav|header|footer|main|aside)(?:[^>]*?)id=["']([^"']+)["'](?:[^>]*?)>/i;
    const metaRegex = /<meta(?:[^>]*?)name=["']([^"']+)["'](?:[^>]*?)>/i;
    const linkRegex = /<link(?:[^>]*?)rel=["']([^"']+)["'](?:[^>]*?)>/i;
    const scriptRegex = /<script(?:[^>]*?)src=["']([^"']+)["'](?:[^>]*?)>/i;
    const imgRegex = /<img(?:[^>]*?)(?:alt=["']([^"']+)["']|src=["']([^"']+)["'])(?:[^>]*?)>/i;
    const formRegex = /<form(?:[^>]*?)(?:id=["']([^"']+)["']|action=["']([^"']+)["']|method=["']([^"']+)["'])(?:[^>]*?)>/i;
    
    let lineNumber = offset;
    
    lines.forEach((line, index) => {
      lineNumber = offset + index + 1;
      let match;
      let type = "";
      let tag = "";
      let preview = "";
      let indent = 0;
      
      // Check for headings (highest priority)
      if ((match = line.match(headingRegex))) {
        tag = match[1];
        preview = match[2].replace(/<[^>]*>/g, '').trim();
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = parseInt(tag.substring(1)) - 1;
        type = "heading";
      }
      // Check for divs with IDs
      else if ((match = line.match(divWithIdRegex))) {
        tag = `${match[1]}#${match[2]}`;
        preview = match[0].replace(/<[^>]*>/g, '').trim();
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 3;
        type = "container";
      }
      // Check for meta tags
      else if ((match = line.match(metaRegex))) {
        tag = `meta[${match[1]}]`;
        preview = line.includes('content=') ? line.match(/content=["']([^"']+)["']/i)?.[1] || "" : "";
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 2;
        type = "meta";
      }
      // Check for link tags
      else if ((match = line.match(linkRegex))) {
        tag = `link[${match[1]}]`;
        preview = line.includes('href=') ? line.match(/href=["']([^"']+)["']/i)?.[1] || "" : "";
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 2;
        type = "link";
      }
      // Check for script tags
      else if ((match = line.match(scriptRegex))) {
        tag = 'script';
        preview = match[1];
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 2;
        type = "script";
      }
      // Check for img tags
      else if ((match = line.match(imgRegex))) {
        tag = 'img';
        preview = match[1] || match[2] || "";
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 3;
        type = "image";
      }
      // Check for form tags
      else if ((match = line.match(formRegex))) {
        tag = 'form';
        preview = match[1] || match[2] || match[3] || "";
        if (preview.length > 30) preview = preview.substring(0, 30) + '...';
        indent = 3;
        type = "form";
      }
      
      if (tag) {
        outlineItems.push({
          tag,
          line: lineNumber,
          indent,
          preview,
          type
        });
      }
    });
    
    return outlineItems;
  }, []);

  // Generate outlines for each section
  useEffect(() => {
    if (!html) {
      setFullOutline([]);
      setHeadOutline([]);
      setBodyOutline([]);
      return;
    }

    // Generate outline for full HTML
    setFullOutline(generateOutline(html));
    
    // Generate outline for head section
    const headStartLine = html.substring(0, html.indexOf('<head')).split('\n').length - 1;
    setHeadOutline(generateOutline(sections.head, headStartLine));
    
    // Generate outline for body section
    const bodyStartLine = html.substring(0, html.indexOf('<body')).split('\n').length - 1;
    setBodyOutline(generateOutline(sections.body, bodyStartLine));
    
  }, [html, sections, generateOutline]);

  // Format HTML with proper indentation and line numbers
  const formatHtml = useCallback((htmlContent: string, showLineNumbers = true) => {
    if (!htmlContent) return '';
    
    // Split the HTML into lines and remove empty lines
    let lines = htmlContent
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let formattedLines: string[] = [];
    let indentLevel = 0;
    
    // Process each line with proper indentation
    lines.forEach((line, index) => {
      // Decrease indent for closing tags
      if (line.match(/^<\//)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Calculate indentation
      const indent = ' '.repeat(indentLevel * indentSize);
      
      // Add line number if requested
      const lineNumber = showLineNumbers ? 
        `<span class="line-number">${index + 1}</span>` : '';
      
      // Add syntax highlighting
      const highlightedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;(\/?[a-zA-Z][^\s&>]*)/g, '<span style="color: #ff79c6;">&lt;$1</span>')
        .replace(/([a-zA-Z-]+)=/g, '<span style="color: #8be9fd;">$1</span>=')
        .replace(/"([^"]*)"/g, '<span style="color: #50fa7b;">"$1"</span>');
      
      // Add the line to our formatted output with proper indentation
      formattedLines.push(`<div class="html-line" data-line="${index + 1}">${lineNumber}<span class="line-content">${indent}${highlightedLine}</span></div>`);
      
      // Increase indent for opening tags that aren't self-closing
      if (line.match(/^<[^/][^>]*>$/) && !line.match(/\/>$/)) {
        indentLevel++;
      }
    });

    return formattedLines.join('');
  }, [indentSize]);

  // Download functionality
  const downloadHtml = useCallback(() => {
    // Create a simple HTML file with the formatted content
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `html-content-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [html]);

  // Make the modal resizable
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    
    const modal = modalRef.current;
    
    // Create resize handles
    const createResizer = (direction: string) => {
      const resizer = document.createElement('div');
      resizer.className = `resizer resizer-${direction}`;
      resizer.style.position = 'absolute';
      
      // Set position and size based on direction
      if (direction === 'n') {
        resizer.style.top = '-5px';
        resizer.style.left = '0';
        resizer.style.width = '100%';
        resizer.style.height = '10px';
        resizer.style.cursor = 'ns-resize';
      } else if (direction === 's') {
        resizer.style.bottom = '-5px';
        resizer.style.left = '0';
        resizer.style.width = '100%';
        resizer.style.height = '10px';
        resizer.style.cursor = 'ns-resize';
      } else if (direction === 'e') {
        resizer.style.right = '-5px';
        resizer.style.top = '0';
        resizer.style.width = '10px';
        resizer.style.height = '100%';
        resizer.style.cursor = 'ew-resize';
      } else if (direction === 'w') {
        resizer.style.left = '-5px';
        resizer.style.top = '0';
        resizer.style.width = '10px';
        resizer.style.height = '100%';
        resizer.style.cursor = 'ew-resize';
      } else if (direction === 'ne') {
        resizer.style.top = '-5px';
        resizer.style.right = '-5px';
        resizer.style.width = '10px';
        resizer.style.height = '10px';
        resizer.style.cursor = 'nesw-resize';
      } else if (direction === 'nw') {
        resizer.style.top = '-5px';
        resizer.style.left = '-5px';
        resizer.style.width = '10px';
        resizer.style.height = '10px';
        resizer.style.cursor = 'nwse-resize';
      } else if (direction === 'se') {
        resizer.style.bottom = '-5px';
        resizer.style.right = '-5px';
        resizer.style.width = '10px';
        resizer.style.height = '10px';
        resizer.style.cursor = 'nwse-resize';
      } else if (direction === 'sw') {
        resizer.style.bottom = '-5px';
        resizer.style.left = '-5px';
        resizer.style.width = '10px';
        resizer.style.height = '10px';
        resizer.style.cursor = 'nesw-resize';
      }
      
      return resizer;
    };
    
    // Add resize handles to the modal
    const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    const resizers: HTMLDivElement[] = [];
    
    directions.forEach(dir => {
      const resizer = createResizer(dir);
      modal.appendChild(resizer);
      resizers.push(resizer);
      
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let startLeft = 0;
      let startTop = 0;
      
      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = modal.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        if (dir.includes('e')) {
          modal.style.width = `${startWidth + dx}px`;
        }
        if (dir.includes('s')) {
          modal.style.height = `${startHeight + dy}px`;
        }
        if (dir.includes('w')) {
          modal.style.width = `${startWidth - dx}px`;
          modal.style.left = `${startLeft + dx}px`;
        }
        if (dir.includes('n')) {
          modal.style.height = `${startHeight - dy}px`;
          modal.style.top = `${startTop + dy}px`;
        }
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      resizer.addEventListener('mousedown', onMouseDown);
    });
    
    // Make the modal draggable by the header
    const header = modal.querySelector('.modal-header') as HTMLElement;
    if (header) {
      header.style.cursor = 'move';
      
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;
      
      const onMouseDown = (e: MouseEvent) => {
        // Only enable dragging if we're clicking on the header itself, not its children
        if (e.target !== header && !header.contains(e.target as Node)) return;
        
        // Don't drag when clicking buttons
        if ((e.target as HTMLElement).tagName === 'BUTTON' || 
            (e.target as HTMLElement).closest('button')) {
          return;
        }
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = modal.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        modal.style.left = `${startLeft + dx}px`;
        modal.style.top = `${startTop + dy}px`;
      };
      
      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      header.addEventListener('mousedown', onMouseDown);
    }
    
    // Cleanup
    return () => {
      resizers.forEach(resizer => {
        resizer.remove();
      });
      
      if (header) {
        header.style.cursor = 'default';
        header.removeEventListener('mousedown', header.onmousedown as any);
      }
    };
  }, [isOpen]);

  // Scroll to a specific line
  const scrollToLine = useCallback((lineNumber: number) => {
    let preElement: HTMLElement | null = null;
    
    // Determine which pre element to use based on active tab
    switch (activeTab) {
      case 'full':
        preElement = fullPreRef.current;
        break;
      case 'head':
        preElement = headPreRef.current;
        break;
      case 'body':
        preElement = bodyPreRef.current;
        break;
      default:
        preElement = fullPreRef.current;
    }
    
    if (!preElement) return;
    
    // Find the line element
    const lineElement = preElement.querySelector(`[data-line="${lineNumber}"]`);
    
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add a flash effect to highlight the line
      lineElement.classList.add('flash-highlight');
      setTimeout(() => {
        lineElement.classList.remove('flash-highlight');
      }, 2000);
    }
  }, [activeTab]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (modalRef.current) {
      if (!isFullscreen) {
        modalRef.current.style.width = '95vw';
        modalRef.current.style.height = '95vh';
        modalRef.current.style.top = '2.5vh';
        modalRef.current.style.left = '2.5vw';
      } else {
        modalRef.current.style.width = '75%';
        modalRef.current.style.height = '80%';
        modalRef.current.style.top = '10%';
        modalRef.current.style.left = '12.5%';
      }
    }
  }, [isFullscreen]);

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Format sections with current indentation setting and line numbers
  const formattedFullHtml = useMemo(() => formatHtml(html, lineNumbers), [html, formatHtml, lineNumbers]);
  const formattedHead = useMemo(() => formatHtml(sections.head, lineNumbers), [sections.head, formatHtml, lineNumbers]);
  const formattedBody = useMemo(() => formatHtml(sections.body, lineNumbers), [sections.body, formatHtml, lineNumbers]);
  const formattedScripts = useMemo(() => 
    sections.scripts.map(script => formatHtml(script, lineNumbers)), 
    [sections.scripts, formatHtml, lineNumbers]
  );

  // Get the current outline based on active tab
  const currentOutline = useMemo(() => {
    switch (activeTab) {
      case 'head':
        return headOutline;
      case 'body':
        return bodyOutline;
      case 'full':
      default:
        return fullOutline;
    }
  }, [activeTab, fullOutline, headOutline, bodyOutline]);

  // Group outline items by type for better organization
  const groupedOutline = useMemo(() => {
    const groups: {[key: string]: typeof currentOutline} = {
      headings: [],
      containers: [],
      meta: [],
      resources: [],
      other: []
    };
    
    currentOutline.forEach(item => {
      if (item.type === 'heading') {
        groups.headings.push(item);
      } else if (item.type === 'container') {
        groups.containers.push(item);
      } else if (['meta', 'link'].includes(item.type)) {
        groups.meta.push(item);
      } else if (['script', 'image'].includes(item.type)) {
        groups.resources.push(item);
      } else {
        groups.other.push(item);
      }
    });
    
    return groups;
  }, [currentOutline]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl flex flex-col relative"
        style={{ 
          width: '75%', 
          height: '80%', 
          position: 'absolute',
          top: '10%',
          left: '12.5%'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b modal-header">
          <h2 className="text-xl font-bold">HTML Inspector</h2>
          <div className="flex items-center gap-4">
            {/* Indentation size slider */}
            <div className="flex items-center gap-2">
              <label htmlFor="indent-size" className="text-sm text-gray-600">Indent:</label>
              <input 
                id="indent-size"
                type="range" 
                min="1" 
                max="8" 
                value={indentSize} 
                onChange={(e) => setIndentSize(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{indentSize} spaces</span>
            </div>
            
            <button
              onClick={() => setLineNumbers(!lineNumbers)}
              className={`p-2 rounded-md ${lineNumbers ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'} flex items-center gap-1`}
              title="Toggle line numbers"
            >
              <Hash size={16} />
              <span>Line Numbers</span>
            </button>
            
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-md ${showOutline ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'} flex items-center gap-1`}
              title="Toggle document outline"
            >
              <List size={16} />
              <span>Outline</span>
            </button>
            
            <button
              onClick={downloadHtml}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700 flex items-center gap-1"
              title="Download formatted HTML file"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              onClick={() => copyToClipboard(html)}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700 flex items-center gap-1"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy All'}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'full' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            <FileText size={16} />
            Full HTML
          </button>
          <button
            onClick={() => setActiveTab('head')}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'head' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Code size={16} />
            HEAD
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'body' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Code size={16} />
            BODY
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'scripts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
            }`}
          >
            <Code size={16} />
            Scripts ({sections.scripts.length})
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Document Outline */}
          {showOutline && (
            <div className="w-72 border-r bg-gray-50 overflow-y-auto p-2">
              <h3 className="font-medium text-sm px-2 py-1 border-b mb-2">
                Document Outline ({currentOutline.length} items)
              </h3>
              
              {/* Headings Section */}
              {groupedOutline.headings.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Headings ({groupedOutline.headings.length})
                  </div>
                  {groupedOutline.headings.map((item, index) => (
                    <button
                      key={`heading-${index}`}
                      onClick={() => scrollToLine(item.line)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded truncate flex items-center"
                      style={{ paddingLeft: `${item.indent * 8 + 8}px` }}
                      title={`Line ${item.line}: ${item.tag}`}
                    >
                      <span className="text-xs bg-blue-100 text-blue-800 rounded px-1 mr-2 font-mono">
                        {item.line}
                      </span>
                      <span className="font-medium">{item.tag}</span>
                      {item.preview && (
                        <span className="ml-2 text-gray-500 truncate">{item.preview}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Containers Section */}
              {groupedOutline.containers.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Containers with IDs ({groupedOutline.containers.length})
                  </div>
                  {groupedOutline.containers.map((item, index) => (
                    <button
                      key={`container-${index}`}
                      onClick={() => scrollToLine(item.line)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded truncate flex items-center"
                      style={{ paddingLeft: `${item.indent * 8 + 8}px` }}
                      title={`Line ${item.line}: ${item.tag}`}
                    >
                      <span className="text-xs bg-green-100 text-green-800 rounded px-1 mr-2 font-mono">
                        {item.line}
                      </span>
                      <span className="text-green-700">{item.tag}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Meta Section */}
              {groupedOutline.meta.length > 0 && activeTab !== 'body' && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Meta & Links ({groupedOutline.meta.length})
                  </div>
                  {groupedOutline.meta.map((item, index) => (
                    <button
                      key={`meta-${index}`}
                      onClick={() => scrollToLine(item.line)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded truncate flex items-center"
                      title={`Line ${item.line}: ${item.tag}${item.preview ? ` - ${item.preview}` : ''}`}
                    >
                      <span className="text-xs bg-purple-100 text-purple-800 rounded px-1 mr-2 font-mono">
                        {item.line}
                      </span>
                      <span className="text-purple-700">{item.tag}</span>
                      {item.preview && (
                        <span className="ml-2 text-gray-500 truncate">{item.preview}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Resources Section */}
              {groupedOutline.resources.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Resources ({groupedOutline.resources.length})
                  </div>
                  {groupedOutline.resources.map((item, index) => (
                    <button
                      key={`resource-${index}`}
                      onClick={() => scrollToLine(item.line)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded truncate flex items-center"
                      title={`Line ${item.line}: ${item.tag}${item.preview ? ` - ${item.preview}` : ''}`}
                    >
                      <span className="text-xs bg-amber-100 text-amber-800 rounded px-1 mr-2 font-mono">
                        {item.line}
                      </span>
                      <span className="text-amber-700">{item.tag}</span>
                      {item.preview && (
                        <span className="ml-2 text-gray-500 truncate">{item.preview}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Other Elements */}
              {groupedOutline.other.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Other Elements ({groupedOutline.other.length})
                  </div>
                  {groupedOutline.other.map((item, index) => (
                    <button
                      key={`other-${index}`}
                      onClick={() => scrollToLine(item.line)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-gray-200 rounded truncate flex items-center"
                      title={`Line ${item.line}: ${item.tag}`}
                    >
                      <span className="text-xs bg-gray-200 text-gray-800 rounded px-1 mr-2 font-mono">
                        {item.line}
                      </span>
                      <span>{item.tag}</span>
                      {item.preview && (
                        <span className="ml-2 text-gray-500 truncate">{item.preview}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Empty state */}
              {currentOutline.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p>No outline elements found in this section.</p>
                  <p className="text-xs mt-2">Try switching to another tab or section.</p>
                </div>
              )}
            </div>
          )}
          
          {/* HTML Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {/* Active Tab Content */}
            <div className="p-4">
              {activeTab === 'full' && (
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                    <div 
                      ref={fullPreRef}
                      className="p-4 font-mono" 
                      style={{overflowX: 'auto'}}
                      dangerouslySetInnerHTML={{ __html: formattedFullHtml }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 'head' && (
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                    <div 
                      ref={headPreRef}
                      className="p-4 font-mono" 
                      style={{overflowX: 'auto'}}
                      dangerouslySetInnerHTML={{ __html: formattedHead }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 'body' && (
                <div className="rounded-lg border bg-white overflow-hidden">
                  <div className="overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                    <div 
                      ref={bodyPreRef}
                      className="p-4 font-mono" 
                      style={{overflowX: 'auto'}}
                      dangerouslySetInnerHTML={{ __html: formattedBody }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 'scripts' && (
                <div className="space-y-4">
                  {formattedScripts.map((script, index) => (
                    <div key={index} className="rounded-lg border bg-white overflow-hidden">
                      <div className="p-2 bg-gray-50 border-b">
                        <h3 className="font-medium">Script {index + 1}</h3>
                      </div>
                      <div className="overflow-x-auto bg-gray-900 text-gray-300 text-sm">
                        <div 
                          className="p-4 font-mono" 
                          style={{overflowX: 'auto'}}
                          dangerouslySetInnerHTML={{ __html: script }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Custom scrollbar for code blocks */
        .overflow-x-auto::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
        
        /* Line numbers */
        .line-number {
          display: inline-block;
          min-width: 3rem;
          padding-right: 1rem;
          text-align: right;
          color: #6b7280;
          user-select: none;
          border-right: 1px solid #4a5568;
          margin-right: 0.5rem;
        }
        
        /* Line content */
        .line-content {
          white-space: pre;
        }
        
        /* HTML line */
        .html-line {
          display: flex;
          align-items: flex-start;
          width: 100%;
        }
        
        /* Flash highlight effect */
        .flash-highlight {
          animation: flash-highlight 2s ease-out;
        }
        
        @keyframes flash-highlight {
          0%, 100% { background-color: transparent; }
          20% { background-color: rgba(59, 130, 246, 0.3); }
        }
      `}</style>
    </div>
  );
};

export default HtmlInspector;