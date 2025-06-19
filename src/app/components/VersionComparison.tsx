'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, Eye, EyeOff } from 'lucide-react';
import { getBriefById } from '@/server/actions/briefs';
import TooltipWrapper from './TooltipWrapper';

interface BriefVersion {
  id: string;
  versionNumber: number;
  changeLog?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDraft: boolean;
  isActive?: boolean;
  draftNumber?: number;
}

interface VersionComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  versions: BriefVersion[];
  currentVersionId: string;
  defaultCompareVersionId?: string;
}

interface BriefData {
  id: string;
  title: string;
  abstract?: string;
  response: string;
  thinking?: string;
  versionNumber: number;
  isDraft: boolean;
  changeLog?: string;
}

// Word-level diff within a line
function calculateWordDiff(oldLine: string, newLine: string) {
  const oldWords = oldLine.split(/(\s+)/);
  const newWords = newLine.split(/(\s+)/);
  
  const matrix: number[][] = [];
  for (let i = 0; i <= oldWords.length; i++) {
    matrix[i] = [];
    for (let j = 0; j <= newWords.length; j++) {
      if (i === 0) matrix[i]![j] = j;
      else if (j === 0) matrix[i]![j] = i;
      else if (oldWords[i - 1] === newWords[j - 1]) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = 1 + Math.min(
          matrix[i - 1]![j]!,
          matrix[i]![j - 1]!,
          matrix[i - 1]![j - 1]!
        );
      }
    }
  }
  
  const diff: Array<{ type: 'equal' | 'delete' | 'insert', text: string }> = [];
  let i = oldWords.length;
  let j = newWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      const word = oldWords[i - 1];
      if (word !== undefined) {
        diff.unshift({ type: 'equal', text: word });
      }
      i--;
      j--;
    } else if (i > 0 && (j === 0 || (matrix[i - 1] && matrix[i] && matrix[i - 1]![j]! <= matrix[i]![j - 1]!))) {
      const word = oldWords[i - 1];
      if (word !== undefined) {
        diff.unshift({ type: 'delete', text: word });
      }
      i--;
    } else if (j > 0) {
      const word = newWords[j - 1];
      if (word !== undefined) {
        diff.unshift({ type: 'insert', text: word });
      }
      j--;
    }
  }
  
  return diff;
}

// Hybrid diff calculation: line-based structure with word-level precision
function calculateDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Line-based diff first
  const matrix: number[][] = [];
  for (let i = 0; i <= oldLines.length; i++) {
    matrix[i] = [];
    for (let j = 0; j <= newLines.length; j++) {
      if (i === 0) matrix[i]![j] = j;
      else if (j === 0) matrix[i]![j] = i;
      else if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = 1 + Math.min(
          matrix[i - 1]![j]!,
          matrix[i]![j - 1]!,
          matrix[i - 1]![j - 1]!
        );
      }
    }
  }
  
  const lineDiff: Array<{ type: 'equal' | 'delete' | 'insert' | 'modified', oldLine?: string, newLine?: string, text: string }> = [];
  let i = oldLines.length;
  let j = newLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      const line = oldLines[i - 1];
      if (line !== undefined) {
        lineDiff.unshift({ type: 'equal', text: line });
      }
      i--;
      j--;
    } else if (i > 0 && j > 0) {
      // Lines are different - check if they're similar enough for word-level diff
      const oldLine = oldLines[i - 1]!;
      const newLine = newLines[j - 1]!;
      
      // If both lines are headers or both are content, do word-level diff
      const bothHeaders = oldLine.startsWith('# ') && newLine.startsWith('# ');
      const neitherHeader = !oldLine.startsWith('# ') && !newLine.startsWith('# ');
      
      if (bothHeaders || neitherHeader) {
        lineDiff.unshift({ type: 'modified', oldLine, newLine, text: '' });
        i--;
        j--;
      } else if (i > 0 && (j === 0 || (matrix[i - 1] && matrix[i] && matrix[i - 1]![j]! <= matrix[i]![j - 1]!))) {
        lineDiff.unshift({ type: 'delete', text: oldLine });
        i--;
      } else {
        lineDiff.unshift({ type: 'insert', text: newLine });
        j--;
      }
    } else if (i > 0) {
      const line = oldLines[i - 1];
      if (line !== undefined) {
        lineDiff.unshift({ type: 'delete', text: line });
      }
      i--;
    } else if (j > 0) {
      const line = newLines[j - 1];
      if (line !== undefined) {
        lineDiff.unshift({ type: 'insert', text: line });
      }
      j--;
    }
  }
  
  return lineDiff;
}

// Render word-level diff within a line
function renderWordDiff(wordDiff: Array<{ type: 'equal' | 'delete' | 'insert', text: string }>, leftVersionName: string, rightVersionName: string) {
  return wordDiff.map((part, index) => {
    if (part.type === 'equal') {
      return <span key={index}>{part.text}</span>;
    } else if (part.type === 'delete') {
      return (
        <span 
          key={index} 
          className="bg-red-100 text-red-800 line-through"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
          title={`Removed from ${leftVersionName}`}
        >
          {part.text}
        </span>
      );
    } else {
      return (
        <span 
          key={index} 
          className="bg-green-100 text-green-800"
          style={{ backgroundColor: '#dcfce7', color: '#166534' }}
          title={`Added in ${rightVersionName}`}
        >
          {part.text}
        </span>
      );
    }
  });
}

// Enhanced diff rendering with proper header formatting and word-level precision
function renderDiff(diff: Array<{ type: 'equal' | 'delete' | 'insert' | 'modified', oldLine?: string, newLine?: string, text: string }>, leftVersionName: string, rightVersionName: string) {
  const elements: React.ReactNode[] = [];
  
  diff.forEach((part, index) => {
    if (part.type === 'equal') {
      // Handle headers specially
      if (part.text.trim().startsWith('# ')) {
        elements.push(
          <div key={index} className="text-lg font-bold text-gray-800 mt-6 mb-2 border-b border-gray-300 pb-1">
            {part.text.replace(/^#\s*/, '')}
          </div>
        );
      } else if (part.text.trim() === '') {
        // Handle empty lines
        elements.push(<br key={index} />);
      } else {
        elements.push(
          <div key={index} className="mb-2">
            {part.text}
          </div>
        );
      }
    } else if (part.type === 'modified') {
      // Handle modified lines with word-level diff
      const oldLine = part.oldLine!;
      const newLine = part.newLine!;
      const wordDiff = calculateWordDiff(oldLine, newLine);
      
      if (oldLine.trim().startsWith('# ')) {
        // Modified header
        elements.push(
          <div key={index} className="text-lg font-bold mt-6 mb-2 border-b border-gray-300 pb-1">
            {renderWordDiff(wordDiff.map(w => ({ ...w, text: w.text.replace(/^#\s*/, '') })), leftVersionName, rightVersionName)}
          </div>
        );
      } else {
        // Modified content line
        elements.push(
          <div key={index} className="mb-2">
            {renderWordDiff(wordDiff, leftVersionName, rightVersionName)}
          </div>
        );
      }
    } else if (part.type === 'delete') {
      // Handle headers specially for deletions
      if (part.text.trim().startsWith('# ')) {
        elements.push(
          <div key={index} className="text-lg font-bold mt-6 mb-2 border-b pb-1 bg-red-100 text-red-800 line-through border-red-300 px-2 py-1 rounded">
            <span className="text-xs bg-red-200 text-red-900 px-2 py-1 rounded mr-2">REMOVED FROM {leftVersionName.toUpperCase()}</span>
            {part.text.replace(/^#\s*/, '')}
          </div>
        );
      } else if (part.text.trim() === '') {
        // Handle empty lines
        elements.push(<br key={index} />);
      } else {
        elements.push(
          <div 
            key={index} 
            className="bg-red-100 text-red-800 line-through relative mb-2 px-2 py-1 rounded"
            style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
            title={`Removed from ${leftVersionName}`}
          >
            {part.text}
          </div>
        );
      }
    } else {
      // Handle headers specially for insertions
      if (part.text.trim().startsWith('# ')) {
        elements.push(
          <div key={index} className="text-lg font-bold mt-6 mb-2 border-b pb-1 bg-green-100 text-green-800 border-green-300 px-2 py-1 rounded">
            <span className="text-xs bg-green-200 text-green-900 px-2 py-1 rounded mr-2">ADDED IN {rightVersionName.toUpperCase()}</span>
            {part.text.replace(/^#\s*/, '')}
          </div>
        );
      } else if (part.text.trim() === '') {
        // Handle empty lines
        elements.push(<br key={index} />);
      } else {
        elements.push(
          <div 
            key={index} 
            className="bg-green-100 text-green-800 relative mb-2 px-2 py-1 rounded"
            style={{ backgroundColor: '#dcfce7', color: '#166534' }}
            title={`Added in ${rightVersionName}`}
          >
            {part.text}
          </div>
        );
      }
    }
  });
  
  return elements;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  defaultCompareVersionId
}) => {
  const [leftVersionId, setLeftVersionId] = useState<string>(currentVersionId);
  const [rightVersionId, setRightVersionId] = useState<string>(defaultCompareVersionId || '');
  const [leftBrief, setLeftBrief] = useState<BriefData | null>(null);
  const [rightBrief, setRightBrief] = useState<BriefData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [compareField, setCompareField] = useState<'all' | 'title' | 'abstract' | 'content' | 'thinking'>('all');

  // Set default compare version when modal opens
  useEffect(() => {
    if (isOpen && !rightVersionId && versions.length > 1) {
      // Find a good default comparison target
      const currentIndex = versions.findIndex(v => v.id === currentVersionId);
      if (currentIndex > 0) {
        const prevVersion = versions[currentIndex - 1];
        if (prevVersion) {
          setRightVersionId(prevVersion.id);
        }
      } else if (currentIndex < versions.length - 1) {
        const nextVersion = versions[currentIndex + 1];
        if (nextVersion) {
          setRightVersionId(nextVersion.id);
        }
      }
    }
  }, [isOpen, currentVersionId, rightVersionId, versions]);

  // Load brief data when version IDs change
  useEffect(() => {
    if (leftVersionId && rightVersionId) {
      loadBriefs();
    }
  }, [leftVersionId, rightVersionId]);

  const loadBriefs = async () => {
    if (!leftVersionId || !rightVersionId) return;
    
    setIsLoading(true);
    try {
      const [leftResult, rightResult] = await Promise.all([
        getBriefById(leftVersionId),
        getBriefById(rightVersionId)
      ]);

      if (leftResult.success && leftResult.data) {
        setLeftBrief({
          id: leftResult.data.id,
          title: leftResult.data.title,
          abstract: leftResult.data.abstract || '',
          response: leftResult.data.response || leftResult.data.content || '',
          thinking: leftResult.data.thinking || '',
          versionNumber: (leftResult.data as any).versionNumber || 1,
          isDraft: (leftResult.data as any).isDraft || false,
          changeLog: (leftResult.data as any).changeLog,
        });
      }

      if (rightResult.success && rightResult.data) {
        setRightBrief({
          id: rightResult.data.id,
          title: rightResult.data.title,
          abstract: rightResult.data.abstract || '',
          response: rightResult.data.response || rightResult.data.content || '',
          thinking: rightResult.data.thinking || '',
          versionNumber: (rightResult.data as any).versionNumber || 1,
          isDraft: (rightResult.data as any).isDraft || false,
          changeLog: (rightResult.data as any).changeLog,
        });
      }
    } catch (error) {
      console.error('Error loading briefs for comparison:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVersionDisplayName = (version: BriefVersion) => {
    if (version.isDraft) {
      return `Draft ${version.draftNumber || 1} (v${version.versionNumber})`;
    }
    return version.changeLog || `Version ${version.versionNumber}`;
  };

  const getFieldContent = (brief: BriefData | null, field: string) => {
    if (!brief) return '';
    switch (field) {
      case 'all': 
        return `# TITLE\n${brief.title}\n\n# ABSTRACT\n${brief.abstract || 'No abstract provided'}\n\n# CONTENT\n${brief.response}\n\n# THINKING\n${brief.thinking || 'No thinking notes provided'}`;
      case 'title': return brief.title;
      case 'abstract': return brief.abstract || '';
      case 'content': return brief.response;
      case 'thinking': return brief.thinking || '';
      default: return '';
    }
  };

  // Group versions by version number and separate drafts
  const groupedVersions = React.useMemo(() => {
    const groups: Record<number, { version: BriefVersion | null; drafts: BriefVersion[] }> = {};
    
    versions.forEach(version => {
      if (!groups[version.versionNumber]) {
        groups[version.versionNumber] = { version: null, drafts: [] };
      }
      
      if (version.isDraft) {
        groups[version.versionNumber]?.drafts.push(version);
      } else {
        groups[version.versionNumber]!.version = version;
      }
    });

    // Sort drafts by most recent edit (updatedAt for drafts, newest first)
    Object.values(groups).forEach(group => {
      group.drafts.sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });
      // Add draft numbers
      group.drafts.forEach((draft, index) => {
        draft.draftNumber = group.drafts.length - index;
      });
    });

    return groups;
  }, [versions]);

  const renderVersionOptions = (excludeId: string) => {
    return Object.entries(groupedVersions)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([versionNumber, group]) => (
        <React.Fragment key={versionNumber}>
          {/* Published Version */}
          {group.version && group.version.id !== excludeId && (
            <option value={group.version.id}>
              {getVersionDisplayName(group.version)}
            </option>
          )}
          
          {/* Drafts */}
          {group.drafts
            .filter(draft => draft.id !== excludeId)
            .map((draft) => (
              <option key={draft.id} value={draft.id}>
                ↳ Draft {draft.draftNumber} (v{draft.versionNumber})
              </option>
            ))}
        </React.Fragment>
      ));
  };

  // Render markdown content for side-by-side view
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('# ')) {
        elements.push(
          <div key={index} className="text-lg font-bold text-gray-800 mt-6 mb-2 border-b border-gray-300 pb-1">
            {line.replace(/^#\s*/, '')}
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<br key={index} />);
      } else {
        elements.push(
          <div key={index} className="mb-2">
            {line}
          </div>
        );
      }
    });
    
    return elements;
  };

  const renderComparison = () => {
    if (!leftBrief || !rightBrief) return null;

    const leftContent = getFieldContent(leftBrief, compareField);
    const rightContent = getFieldContent(rightBrief, compareField);

    if (showDiff) {
      const diff = calculateDiff(leftContent, rightContent);
      const leftVersionName = getVersionDisplayName(versions.find(v => v.id === leftVersionId)!);
      const rightVersionName = getVersionDisplayName(versions.find(v => v.id === rightVersionId)!);
      
      return (
        <div className="prose max-w-none">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm leading-relaxed">
              {renderDiff(diff, leftVersionName, rightVersionName)}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="prose max-w-none">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {getVersionDisplayName(versions.find(v => v.id === leftVersionId)!)}
            </h4>
            <div className="p-4 border rounded-lg bg-blue-50 text-sm leading-relaxed">
              {renderMarkdownContent(leftContent)}
            </div>
          </div>
          <div className="prose max-w-none">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {getVersionDisplayName(versions.find(v => v.id === rightVersionId)!)}
            </h4>
            <div className="p-4 border rounded-lg bg-green-50 text-sm leading-relaxed">
              {renderMarkdownContent(rightContent)}
            </div>
          </div>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Version Comparison</h2>
            <div className="flex items-center gap-4">
              <TooltipWrapper content="Toggle between diff view and side-by-side view" position="bottom">
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="flex items-center gap-2 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                >
                  {showDiff ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showDiff ? 'Side by Side' : 'Show Diff'}
                </button>
              </TooltipWrapper>
              <TooltipWrapper content="Close comparison" position="bottom">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Version Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare From:
                </label>
                <select
                  value={leftVersionId}
                  onChange={(e) => setLeftVersionId(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {renderVersionOptions(rightVersionId)}
                </select>
              </div>

              {/* Field Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare Field:
                </label>
                <select
                  value={compareField}
                  onChange={(e) => setCompareField(e.target.value as any)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Content</option>
                  <option value="content">Content</option>
                  <option value="title">Title</option>
                  <option value="abstract">Abstract</option>
                  <option value="thinking">Thinking</option>
                </select>
              </div>

              {/* Right Version Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare To:
                </label>
                <select
                  value={rightVersionId}
                  onChange={(e) => setRightVersionId(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {renderVersionOptions(leftVersionId)}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs line-through">
                  Deleted
                </span>
                <span className="text-gray-600">Removed content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Added
                </span>
                <span className="text-gray-600">New content</span>
              </div>
            </div>
          </div>

          {/* Comparison Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderComparison()
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VersionComparison;
