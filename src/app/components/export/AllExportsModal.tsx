/**
 * All Exports Modal Component
 * 
 * Shows complete export history with filters and categories
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Search, Filter, Calendar, FileText, User, Search as SearchIcon, RefreshCw, ChevronDown } from 'lucide-react';

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

interface AllExportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AllExportsModal({ isOpen, onClose, userId }: AllExportsModalProps) {
  const [exports, setExports] = useState<ExportHistoryItem[]>([]);
  const [filteredExports, setFilteredExports] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (isOpen) {
      fetchAllExports();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    applyFilters();
  }, [exports, searchQuery, selectedType, selectedFormat, selectedStatus, dateRange, sortBy]);

  const fetchAllExports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/export/history?limit=1000'); // Get all exports
      if (response.ok) {
        const data = await response.json();
        setExports(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch all exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.format.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Format filter
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(item => item.format === selectedFormat);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (dateRange !== 'all') {
        filtered = filtered.filter(item => new Date(item.createdAt) >= filterDate);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'filename':
          return a.filename.localeCompare(b.filename);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'format':
          return a.format.localeCompare(b.format);
        default:
          return 0;
      }
    });

    setFilteredExports(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedFormat('all');
    setSelectedStatus('all');
    setDateRange('all');
    setSortBy('newest');
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
        return <SearchIcon className="w-4 h-4" />;
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

  // Get unique values for filter options
  const uniqueTypes = [...new Set(exports.map(item => item.type))];
  const uniqueFormats = [...new Set(exports.map(item => item.format))];

  // Pagination
  const totalPages = Math.ceil(filteredExports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExports = filteredExports.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Exports</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search exports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>

            {/* Format Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Formats</option>
              {uniqueFormats.map(format => (
                <option key={format} value={format}>{format.toUpperCase()}</option>
              ))}
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="filename">Filename A-Z</option>
                <option value="type">Type</option>
                <option value="format">Format</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAllExports}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {currentExports.length} of {filteredExports.length} exports
            {filteredExports.length !== exports.length && ` (filtered from ${exports.length} total)`}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading exports...</span>
            </div>
          ) : currentExports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No exports found</p>
              <p className="text-sm text-gray-500 mt-1">
                {filteredExports.length === 0 && exports.length > 0 
                  ? 'Try adjusting your filters'
                  : 'Your export history will appear here after you create your first export.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentExports.map((item) => (
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
