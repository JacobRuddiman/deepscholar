'use client';

import { useState } from 'react';
import { exportBriefAsMarkdown, exportBriefAsHTML } from '@/server/actions/export';

interface ExportButtonProps {
  briefId: string;
  briefTitle: string;
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

export function ExportButton({ briefId, briefTitle, variant = 'dropdown', className = '' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    try {
      const result = await exportBriefAsMarkdown(briefId);

      if (!result.success || !result.data) {
        alert(result.error || 'Failed to export');
        return;
      }

      // Create and download file
      const blob = new Blob([result.data.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export brief');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportBriefAsHTML(briefId);

      if (!result.success || !result.data) {
        alert(result.error || 'Failed to export');
        return;
      }

      // Open print dialog with HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export as PDF');
        return;
      }

      printWindow.document.write(result.data.content);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };

      setShowMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export brief');
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={handleExportMarkdown}
          disabled={isExporting}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300
                   dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                   flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Markdown
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300
                   dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                   flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          PDF
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300
                 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                 flex items-center gap-2"
        aria-label={`Export ${briefTitle}`}
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          <div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg
                        border border-gray-200 dark:border-gray-700 py-1 z-20"
            role="menu"
            aria-label="Export format options"
          >
            <button
              onClick={handleExportMarkdown}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              role="menuitem"
              aria-label="Export as Markdown file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Export as Markdown
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              role="menuitem"
              aria-label="Export as PDF (opens print dialog)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Bulk export component
 */
export function BulkExportButton({ briefIds, format }: { briefIds: string[]; format: 'markdown' | 'pdf' }) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkExport = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const total = briefIds.length;

      for (let i = 0; i < total; i++) {
        const briefId = briefIds[i];
        if (!briefId) continue;

        if (format === 'markdown') {
          const result = await exportBriefAsMarkdown(briefId);
          if (result.success && result.data) {
            const blob = new Blob([result.data.content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }

        setProgress(((i + 1) / total) * 100);

        // Small delay to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      alert(`Successfully exported ${total} briefs`);
    } catch (error) {
      console.error('Bulk export failed:', error);
      alert('Some exports failed');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <button
      onClick={handleBulkExport}
      disabled={isExporting || briefIds.length === 0}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
               flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Exporting {progress.toFixed(0)}%</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export {briefIds.length} Briefs</span>
        </>
      )}
    </button>
  );
}
