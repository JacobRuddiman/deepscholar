import React from "react";
import { z } from "zod";
import type { Components } from 'react-markdown';
import DiffMatchPatch from 'diff-match-patch';

import type { BriefData } from '../../components/extract_brief';

// Initialize diff match patch
const dmp = new DiffMatchPatch();

// Define a schema for URL validation
export const urlSchema = z.string().url("Please enter a valid URL");

// Theme definitions based on source
export type ThemeSource = 'openai' | 'perplexity' | 'default';

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
  
  if (briefData.url?.includes('openai.com') || briefData.model?.toLowerCase().includes('chatgpt')) {
    return 'openai';
  }
  
  if (briefData.url?.includes('perplexity.ai') || briefData.model?.toLowerCase().includes('perplexity')) {
    return 'perplexity';
  }
  
  return 'default';
}

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
  children: React.ReactNode;
  inline?: boolean;
} & React.HTMLAttributes<HTMLElement>;

// Function to create markup for modified content with highlight for additions
export const createDiffMarkup = (originalText: string, newText: string, highlightClass: string): string => {
  if (!originalText) return newText;
  
  const diff = dmp.diff_main(originalText, newText);
  dmp.diff_cleanupSemantic(diff);
  
  let html = '';
  for (const [op, text] of diff) {
    if (op === 1) { // Addition
      html += `<span class="${highlightClass}">${text}</span>`;
    } else if (op === 0) { // No change
      html += text;
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
  a: ({ href, children }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline mx-1"
    >
      {children}
    </a>
  ),
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
