/**
 * Enhanced Export History Component
 * 
 * Shows recent exports with re-download functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Download, Clock, FileText, User, Search, RefreshCw } from 'lucide-react';
import AllExportsModal from './AllExportsModal';

interface ExportHistoryItem {
  id: string;
  type: 'brief' | 'user_profile' | 'search_results';
  format: string;
  filename: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'failed';
  targetId: string;
  options?: {
    includeReferences?: boolean;
    includeMetadata?: boolean;
  };
}

interface ExportHistoryProps {
  userId: string;
  onRefresh?: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function ExportHistory({ userId, onRefresh, refreshTrigger }: ExportHistoryProps) {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showAllExportsModal, setShowAllExportsModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchHistory();
    }
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/export/history?limit=5');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedownload = async (item: ExportHistoryItem) => {
    try {
      setDownloading(item.id);
      
      // Construct the original export URL
      let url = '';
      const params = new URLSearchParams();
      
      if (item.format) params.append('format', item.format);
      if (item.options?.includeReferences) params.append('includeReferences', 'true');
      if (item.options?.includeMetadata) params.append('includeMetadata', 'true');
      
      switch (item.type) {
        case 'brief':
          url = `/api/export/brief/${item.targetId}?${params.toString()}`;
          break;
        case 'user_profile':
          url = `/api/export/user/${item.targetId}?${params.toString()}`;
          break;
        case 'search_results':
          params.append('query', item.targetId);
          url = `/api/export/search?${params.toString()}`;
          break;
        default:
          throw new Error('Unknown export type');
      }

      // Trigger download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Re-download failed:', error);
      alert('Failed to re-download file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brief':
        return <FileText className="w-4 h-4" />;
      case 'user_profile':
        return <User className="w-4 h-4" />;
      case 'search_results':
        return <Search className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'brief':
        return 'Brief Export';
      case 'user_profile':
        return 'User Profile';
      case 'search_results':
        return 'Search Results';
      default:
        return 'Export';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const getFormatBadgeColor = (format: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-800',
      docx: 'bg-blue-100 text-blue-800',
      markdown: 'bg-gray-100 text-gray-800',
      html: 'bg-orange-100 text-orange-800',
      json: 'bg-green-100 text-green-800',
      csv: 'bg-purple-100 text-purple-800',
      txt: 'bg-yellow-100 text-yellow-800'
    };
    return colors[format] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Exports
        </h2>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading export history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Exports
        </h2>
        <button
          onClick={() => {
            fetchHistory();
            onRefresh?.();
          }}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No exports yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Your export history will appear here after you create your first export.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="font-medium text-gray-900 truncate text-sm">
                    {item.filename}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getFormatBadgeColor(item.format)}`}>
                    {item.format.toUpperCase()}
                  </span>
                  {item.status === 'failed' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex-shrink-0">
                      Failed
                    </span>
                  )}
                </div>
                
                <div className="flex-shrink-0 ml-2">
                  {item.status === 'completed' ? (
                    <button
                      onClick={() => handleRedownload(item)}
                      disabled={downloading === item.id}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={downloading === item.id ? 'Downloading...' : 'Re-download'}
                    >
                      {downloading === item.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">
                      Failed
                    </span>
                  )}
                </div>
              </div>
              
              {/* Details Row */}
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <span className="flex-shrink-0">{getTypeLabel(item.type)}</span>
                <span className="flex-shrink-0">{item.size}</span>
                <span className="truncate">{formatDate(item.createdAt)}</span>
              </div>
              
              {/* Options Row */}
              {item.options && (
                <div className="flex items-center gap-2">
                  {item.options.includeReferences && (
                    <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded flex-shrink-0">
                      References
                    </span>
                  )}
                  {item.options.includeMetadata && (
                    <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded flex-shrink-0">
                      Metadata
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {history.length} recent exports. 
            <span 
              className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={() => setShowAllExportsModal(true)}
            >
              View all exports
            </span>
          </p>
        </div>
      )}

      {/* All Exports Modal */}
      <AllExportsModal
        isOpen={showAllExportsModal}
        onClose={() => setShowAllExportsModal(false)}
        userId={userId}
      />
    </div>
  );
}
