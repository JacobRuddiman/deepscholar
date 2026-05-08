import React from "react";
import { z } from "zod";
import type { Components } from 'react-markdown';
import DiffMatchPatch from 'diff-match-patch';

import type { BriefData } from '@/functions/types';

/**
 * Escape special HTML characters to prevent XSS when building HTML strings.
 * Used by createDiffMarkup and detectAndFormatReferences to sanitize text
 * before inserting it into HTML markup.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize diff match patch
const dmp = new DiffMatchPatch();

// Define a schema for URL validation
export const urlSchema = z.string().url("Please enter a valid URL");

// Theme definitions based on source
export type ThemeSource = 'openai' | 'perplexity' | 'anthropic' | 'default';

export interface ThemeColors {
  primary: string;   // Background gradient
  secondary: string; // Border color
  tertiary: string;  // Icon color
  highlight: string; // Highlight color for edits
  flash: string;     // Flash color for buttons
}

export const themeColors: Record<ThemeSource, ThemeColors> = {
  openai: {
    primary: 'from-green-100/30 via-teal-50/20 to-transparent',
    secondary: 'border-green-200',
    tertiary: 'text-green-600',
    highlight: 'bg-green-100',
    flash: 'from-green-400 to-emerald-500'
  },
  perplexity: {
    primary: 'from-purple-100/30 via-indigo-50/20 to-transparent',
    secondary: 'border-purple-200',
    tertiary: 'text-purple-600',
    highlight: 'bg-purple-100',
    flash: 'from-purple-400 to-violet-500'
  },
  anthropic: {
    primary: 'from-amber-100/30 via-orange-50/20 to-transparent',
    secondary: 'border-amber-200',
    tertiary: 'text-amber-600',
    highlight: 'bg-amber-100',
    flash: 'from-amber-400 to-orange-500'
  },
  default: {
    primary: 'from-blue-100/30 via-sky-50/20 to-transparent',
    secondary: 'border-blue-200',
    tertiary: 'text-blue-600',
    highlight: 'bg-blue-100',
    flash: 'from-blue-400 to-cyan-500'
  }
};

// Rest of your existing utility functions remain the same...
// (I'm keeping all the other functions as they were)

// Helper function to determine theme based on URL or model
export function determineTheme(briefData: BriefData | null): ThemeSource {
  if (!briefData) return 'default';

  if (briefData.model?.toLowerCase().includes('chatgpt') || briefData.model === 'openai') {
    return 'openai';
  }

  if (briefData.model?.toLowerCase().includes('perplexity') || briefData.model === 'perplexity') {
    return 'perplexity';
  }

  if (briefData.model?.toLowerCase().includes('claude') || briefData.model === 'anthropic') {
    return 'anthropic';
  }

  return 'default';
}

// Provider configuration for upload UI
export type ProviderId = 'chatgpt' | 'perplexity' | 'claude' | 'other';

export interface ProviderInstruction {
  step: number;
  title: string;
  description: string;
  imagePlaceholder: string;
}

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  model: BriefData['model'];
  theme: ThemeSource;
  uploadMethod: 'url' | 'file' | 'manual';
  acceptedFiles?: string;
  urlPlaceholder?: string;
  instructions: ProviderInstruction[];
}

export const PROVIDER_CONFIG: ProviderConfig[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    description: 'OpenAI deep research share links',
    model: 'openai',
    theme: 'openai',
    uploadMethod: 'url',
    urlPlaceholder: 'https://chatgpt.com/share/...',
    instructions: [
      { step: 1, title: 'Open your chat', description: 'Go to ChatGPT and open the deep research conversation you want to share.', imagePlaceholder: 'ChatGPT conversation view' },
      { step: 2, title: 'Create share link', description: 'Click the share button in the top-right corner and copy the share link.', imagePlaceholder: 'ChatGPT share button' },
      { step: 3, title: 'Paste the URL', description: 'Paste the share link below and click Fetch Brief.', imagePlaceholder: 'Paste URL into input field' },
    ],
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    description: 'Perplexity research share links',
    model: 'perplexity',
    theme: 'perplexity',
    uploadMethod: 'url',
    urlPlaceholder: 'https://www.perplexity.ai/search/...',
    instructions: [
      { step: 1, title: 'Open your thread', description: 'Go to Perplexity and open the research thread you want to share.', imagePlaceholder: 'Perplexity thread view' },
      { step: 2, title: 'Copy share link', description: 'Click the share icon and copy the link to your clipboard.', imagePlaceholder: 'Perplexity share button' },
      { step: 3, title: 'Paste the URL', description: 'Paste the share link below and click Fetch Brief.', imagePlaceholder: 'Paste URL into input field' },
    ],
  },
  {
    id: 'claude',
    label: 'Claude',
    description: 'Upload exported Claude research files',
    model: 'anthropic',
    theme: 'anthropic',
    uploadMethod: 'file',
    acceptedFiles: '.md,.markdown',
    instructions: [
      { step: 1, title: 'Run deep research', description: 'Use Claude to run a deep research query and wait for the results.', imagePlaceholder: 'Claude research conversation' },
      { step: 2, title: 'Download the file', description: 'Click the download/copy button to save the response as a Markdown file.', imagePlaceholder: 'Claude download button' },
      { step: 3, title: 'Upload the file', description: 'Drop the .md file below or click to browse your files.', imagePlaceholder: 'File upload dropzone' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Paste content or upload any file',
    model: 'other',
    theme: 'default',
    uploadMethod: 'manual',
    acceptedFiles: '.html,.htm,.txt,.md,.markdown',
    instructions: [
      { step: 1, title: 'Copy your content', description: 'Copy the research output from any AI platform or document.', imagePlaceholder: 'Copy content from source' },
      { step: 2, title: 'Paste or upload', description: 'Paste the text below, or switch to file upload for .html, .txt, or .md files.', imagePlaceholder: 'Paste or upload interface' },
      { step: 3, title: 'Review & publish', description: 'Review the parsed sections, make any edits, then publish.', imagePlaceholder: 'Review parsed brief' },
    ],
  },
];

// Add this helper function for grouping sources by domain
export function groupSourcesByDomain(sources: BriefData['sources']) {
  if (!sources) return new Map();
  
  return sources.reduce((groups, source) => {
    try {
      const url = new URL(source.url);
      const domain = url.hostname.replace('www.', '');
      const existing = groups.get(domain) || [];
      groups.set(domain, [...existing, source]);
    } catch (e) {
      // If URL parsing fails, group under "Other"
      const existing = groups.get('Other') || [];
      groups.set('Other', [...existing, source]);
    }
    return groups;
  }, new Map<string, typeof sources>());
}

// Helper functions for URL path and favicon
export function getUrlPath(urlString: string): string {
  try {
    const url = new URL(urlString);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path || '/';
  } catch (e) {
    return urlString;
  }
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Add this type for the code component props
export type CodeComponentProps = {
  children?: React.ReactNode;
  inline?: boolean;
} & React.HTMLAttributes<HTMLElement>;

// Function to create markup for modified content with highlight for additions
// SECURITY: All text segments are HTML-escaped before insertion to prevent XSS
export const createDiffMarkup = (originalText: string, newText: string, highlightClass: string): string => {
  if (!originalText) return escapeHtml(newText);

  const diff = dmp.diff_main(originalText, newText);
  dmp.diff_cleanupSemantic(diff);

  let html = '';
  for (const [op, text] of diff) {
    const escaped = escapeHtml(text);
    if (op === 1) { // Addition
      html += `<span class="${escapeHtml(highlightClass)}">${escaped}</span>`;
    } else if (op === 0) { // No change
      html += escaped;
    }
    // We don't render deletions (op === -1)
  }

  return html;
}

// Markdown components configuration for consistent styling
export const markdownComponents: Components = {
  h1: ({children, ...props}) => <h1 className="text-2xl font-bold my-4" {...props}>{children}</h1>,
  h2: ({children, ...props}) => <h2 className="text-xl font-bold my-3" {...props}>{children}</h2>,
  h3: ({children, ...props}) => <h3 className="text-lg font-bold my-3" {...props}>{children}</h3>,
  h4: ({children, ...props}) => <h4 className="text-base font-bold my-2" {...props}>{children}</h4>,
  h5: ({children, ...props}) => <h5 className="text-sm font-bold my-2" {...props}>{children}</h5>,
  h6: ({children, ...props}) => <h6 className="text-xs font-bold my-2" {...props}>{children}</h6>,
  p: ({children, ...props}) => <p className="mb-4 leading-relaxed" {...props}>{children}</p>,
  a: ({ href, children, className, ...props }) => {
    // Check if this is a reference source link
    const isReferenceSource = className?.includes('reference-source');
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={isReferenceSource ? "reference-source" : "text-blue-600 hover:text-blue-800 underline mx-1"}
        {...props}
      >
        {children}
      </a>
    );
  },
  span: ({ className, children, ...props }) => {
    // Check if this is a reference highlight
    if (className?.includes('reference-highlight')) {
      return <span className="reference-highlight" {...props}>{children}</span>;
    }
    return <span className={className} {...props}>{children}</span>;
  },
  ul: ({children, ...props}) => <ul className="list-disc pl-5 my-3" {...props}>{children}</ul>,
  ol: ({children, ...props}) => <ol className="list-decimal pl-5 my-3" {...props}>{children}</ol>,
  li: ({children, ...props}) => <li className="my-1" {...props}>{children}</li>,
  blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3" {...props}>{children}</blockquote>,
  code: ({children, inline, ...props}: CodeComponentProps) => 
    inline 
      ? <code className="bg-gray-100 px-1 rounded" {...props}>{children}</code>
      : <code className="block bg-gray-100 p-2 rounded my-3 overflow-x-auto" {...props}>{children}</code>,
  pre: ({children, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props}>{children}</pre>,
  table: ({children, ...props}) => <table className="border-collapse table-auto w-full my-3" {...props}>{children}</table>,
  thead: ({children, ...props}) => <thead className="bg-gray-100" {...props}>{children}</thead>,
  tbody: ({children, ...props}) => <tbody {...props}>{children}</tbody>,
  tr: ({children, ...props}) => <tr className="border-b border-gray-200" {...props}>{children}</tr>,
  th: ({children, ...props}) => <th className="p-2 text-left font-bold" {...props}>{children}</th>,
  td: ({children, ...props}) => <td className="p-2" {...props}>{children}</td>
};

// Title-specific components that render the title as a span
export const titleComponents: Components = {
  p: ({children, ...props}) => <span className="text-xl font-bold" {...props}>{children}</span>
};

// Reference-specific components
export const referenceComponents: Components = {
  p: ({children, ...props}) => <p className="text-sm text-gray-700 whitespace-pre-wrap" {...props}>{children}</p>,
  a: ({children, ...props}) => <a className="text-blue-600 hover:underline text-sm" {...props}>{children}</a>
};

/**
 * Automatically detects and formats references in text
 * SECURITY: All captured text is HTML-escaped before insertion to prevent XSS.
 * URLs are encoded for href attributes.
 * Supports multiple patterns:
 * 1. "quoted text" [Source Name](URL)
 * 2. "quoted text" (URL)
 * 3. "quoted text" - Source Name
 * 4. According to Source Name, "quoted text"
 */
export function detectAndFormatReferences(text: string): string {
  let formattedText = text;

  // Pattern 1: "quoted text" [Source Name](URL) or "quoted text" (URL)
  // Converts to our reference format
  formattedText = formattedText.replace(
    /"([^"]+)"\s*\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, quote: string, sourceName: string, url: string) => {
      return `<span class="reference-highlight">"${escapeHtml(quote)}"</span> <a href="${escapeHtml(url)}" class="reference-source" target="_blank" rel="noopener noreferrer">[${escapeHtml(sourceName)}]</a>`;
    }
  );

  // Pattern 2: "quoted text" (https://...)
  formattedText = formattedText.replace(
    /"([^"]+)"\s*\((https?:\/\/[^)]+)\)/g,
    (match, quote: string, url: string) => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        return `<span class="reference-highlight">"${escapeHtml(quote)}"</span> <a href="${escapeHtml(url)}" class="reference-source" target="_blank" rel="noopener noreferrer">[${escapeHtml(domain)}]</a>`;
      } catch {
        return match; // Return original if URL parsing fails
      }
    }
  );

  // Pattern 3: "quoted text" - Source Name (assuming source name doesn't contain URLs)
  formattedText = formattedText.replace(
    /"([^"]+)"\s*-\s*([A-Z][^.\n]+?)(?=\.|$|\n)/g,
    (_match, quote: string, sourceName: string) => {
      return `<span class="reference-highlight">"${escapeHtml(quote)}"</span> - ${escapeHtml(sourceName)}`;
    }
  );

  // Pattern 4: According to [Source](URL), "quoted text"
  formattedText = formattedText.replace(
    /According to \[([^\]]+)\]\(([^)]+)\),\s*"([^"]+)"/gi,
    (_match, sourceName: string, url: string, quote: string) => {
      return `According to <a href="${escapeHtml(url)}" class="reference-source" target="_blank" rel="noopener noreferrer">[${escapeHtml(sourceName)}]</a>, <span class="reference-highlight">"${escapeHtml(quote)}"</span>`;
    }
  );

  return formattedText;
}

// Animation variants
export const sectionVariants = {
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
export const urlCardVariants = {
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
