/**
 * Export Center Page
 * 
 * Central hub for all export functionality including manual exports,
 * API access information, and export history
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { isLocalMode, getLocalSession } from '@/lib/localMode';
import BriefSelector from '@/app/components/export/BriefSelector';
import UserSelector from '@/app/components/export/UserSelector';
import SearchQuerySelector from '@/app/components/export/SearchQuerySelector';
import ApiDocumentation from '@/app/components/export/ApiDocumentation';
import ExportHistory from '@/app/components/export/ExportHistory';
import { 
  Download, 
  FileText, 
  Code, 
  Globe, 
  Settings, 
  History,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  User,
  ChevronDown
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  formats: string[];
  icon: React.ReactNode;
  endpoint: string;
}

interface ExportHistory {
  id: string;
  type: string;
  format: string;
  filename: string;
  size: string;
  createdAt: Date;
  status: 'completed' | 'failed' | 'processing';
}

interface BriefOption {
  id: string;
  title: string;
  author: string;
  createdAt: Date;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  briefsCount: number;
}

export default function ExportPage() {
  const { data: session } = useSession();
  
  // Get session (handle local mode)
  const currentSession = isLocalMode() ? getLocalSession() : session;
  const [selectedExport, setSelectedExport] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<any>({
    includeReferences: true, // Default to true as requested
    includeMetadata: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [exportStats, setExportStats] = useState<any>({
    today: 0,
    thisMonth: 0,
    total: 0,
    remaining: 10
  });
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [availableBriefs, setAvailableBriefs] = useState<BriefOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const exportTypes: ExportOption[] = [
    {
      id: 'brief',
      name: 'Research Brief',
      description: 'Export individual research briefs with all metadata, references, and content',
      formats: ['pdf', 'markdown', 'html', 'json', 'docx', 'txt'],
      icon: <FileText className="w-6 h-6" />,
      endpoint: '/api/export/brief/[id]'
    },
    {
      id: 'user_profile',
      name: 'User Profile',
      description: 'Export your complete user profile including statistics and brief history',
      formats: ['json', 'csv', 'pdf', 'html'],
      icon: <User className="w-6 h-6" />,
      endpoint: '/api/export/user/[id]'
    },
    {
      id: 'search_results',
      name: 'Search Results',
      description: 'Export search results with filters and metadata',
      formats: ['csv', 'json', 'html', 'pdf'],
      icon: <Search className="w-6 h-6" />,
      endpoint: '/api/export/search'
    }
  ];

  const formatDescriptions: Record<string, string> = {
    pdf: 'Portable Document Format - Best for sharing and printing',
    markdown: 'Markdown format - Great for documentation and GitHub',
    html: 'HTML format - Perfect for web viewing',
    json: 'JSON format - Ideal for programmatic access',
    csv: 'CSV format - Excellent for spreadsheet analysis',
    docx: 'Microsoft Word format - Professional document format',
    txt: 'Plain text format - Universal compatibility'
  };

  useEffect(() => {
    if (currentSession?.user?.id) {
      loadExportHistory();
      loadExportStats();
      loadAvailableItems();
    }
  }, [currentSession]);

  const loadExportHistory = async () => {
    try {
      const response = await fetch('/api/export/history');
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data);
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
      // Use mock data for demo
      const mockHistory: ExportHistory[] = [
        {
          id: '1',
          type: 'brief',
          format: 'pdf',
          filename: 'research_brief_2024-01-15.pdf',
          size: '2.3 MB',
          createdAt: new Date('2024-01-15'),
          status: 'completed'
        },
        {
          id: '2',
          type: 'user_profile',
          format: 'json',
          filename: 'user_profile_2024-01-14.json',
          size: '45 KB',
          createdAt: new Date('2024-01-14'),
          status: 'completed'
        }
      ];
      setExportHistory(mockHistory);
    }
  };

  const loadExportStats = async () => {
    console.log('📊 Loading export stats...');
    try {
      const response = await fetch('/api/export/stats');
      console.log('📊 Stats response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats data received:', data);
        setExportStats(data);
        console.log('📊 Stats state updated');
      } else {
        console.log('❌ Stats response not ok:', response.statusText);
      }
    } catch (error) {
      console.error('💥 Failed to load export stats:', error);
    }
  };

  const loadAvailableItems = async () => {
    try {
      // Load available briefs
      const briefsResponse = await fetch('/api/briefs?limit=50');
      if (briefsResponse.ok) {
        const briefsData = await briefsResponse.json();
        setAvailableBriefs(briefsData.briefs || []);
      }

      // Load available users (for admin or demo)
      if (isLocalMode()) {
        const usersResponse = await fetch('/api/users?limit=20');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setAvailableUsers(usersData.users || []);
        }
      }
    } catch (error) {
      console.error('Failed to load available items:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedExport || !selectedFormat || !selectedItem) return;

    setIsExporting(true);
    try {
      let url = '';
      const params = new URLSearchParams({
        format: selectedFormat,
        ...exportOptions
      });

      if (selectedExport === 'search_results') {
        // For search results, pass query as a parameter
        params.append('query', selectedItem);
        url = `/api/export/search?${params.toString()}`;
      } else {
        // For other exports, use the ID in the path
        const endpoint = exportTypes.find(t => t.id === selectedExport)?.endpoint.replace('[id]', selectedItem);
        if (!endpoint) throw new Error('Invalid export type');
        url = `${endpoint}?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${selectedFormat}`;

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Refresh data
      console.log('🔄 Refreshing export data after successful export...');
      await loadExportHistory();
      await loadExportStats();
      
      // Trigger history component refresh
      setHistoryRefreshTrigger(Date.now());
      console.log('✅ Export data refreshed');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const resetDailyExports = async () => {
    if (!isLocalMode()) return;
    
    try {
      const response = await fetch('/api/export/reset', { method: 'POST' });
      if (response.ok) {
        await loadExportStats();
      }
    } catch (error) {
      console.error('Failed to reset exports:', error);
    }
  };

  const copyApiExample = (endpoint: string) => {
    const example = `curl -X GET "${window.location.origin}${endpoint}?format=${selectedFormat}&includeReferences=true" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;
    
    navigator.clipboard.writeText(example);
  };

  const getFilteredItems = () => {
    if (selectedExport === 'brief') {
      return availableBriefs.filter(brief => 
        brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brief.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedExport === 'user_profile') {
      return availableUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return [];
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access the export center.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Center</h1>
          <p className="text-gray-600">
            Export your data in various formats for backup, analysis, or integration with other tools.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Remaining exports today: {exportStats.remaining}/10</span>
            </div>
            {isLocalMode() && (
              <button
                onClick={resetDailyExports}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Daily Limit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manual Export Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Manual Export
              </h2>

              {/* Export Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to export?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {exportTypes.map((type) => (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedExport === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedExport(type.id);
                        setSelectedItem('');
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {type.icon}
                        <h3 className="font-medium text-gray-900">{type.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Item Selection */}
              {selectedExport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {selectedExport === 'brief' && 'Select brief to export'}
                    {selectedExport === 'user_profile' && 'Select user profile to export'}
                    {selectedExport === 'search_results' && 'Configure search query'}
                  </label>
                  
                  {selectedExport === 'brief' && (
                    <BriefSelector
                      selectedBriefId={selectedItem}
                      onSelectBrief={setSelectedItem}
                      currentUserId={currentSession?.user?.id}
                    />
                  )}
                  
                  {selectedExport === 'user_profile' && (
                    <UserSelector
                      selectedUserId={selectedItem}
                      onSelectUser={setSelectedItem}
                      currentUserId={currentSession?.user?.id}
                    />
                  )}
                  
                  {selectedExport === 'search_results' && (
                    <SearchQuerySelector
                      selectedQuery={selectedItem}
                      onSelectQuery={setSelectedItem}
                    />
                  )}
                </motion.div>
              )}

              {/* Format Selection */}
              {selectedExport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose export format
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {exportTypes.find(t => t.id === selectedExport)?.formats.map((format) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          selectedFormat === format
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm uppercase">{format}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatDescriptions[format]}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Export Options */}
              {selectedExport && selectedFormat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export options
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata || false}
                        onChange={(e) => setExportOptions((prev: any) => ({
                          ...prev,
                          includeMetadata: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include metadata</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeReferences || false}
                        onChange={(e) => setExportOptions((prev: any) => ({
                          ...prev,
                          includeReferences: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include references</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Export Button - Only show when all required fields are selected */}
              {selectedExport && selectedFormat && selectedItem && (
                <button
                  onClick={handleExport}
                  disabled={isExporting || exportStats.remaining <= 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export {selectedFormat?.toUpperCase()}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Enhanced API Documentation */}
            <ApiDocumentation />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Export History */}
            <ExportHistory 
              userId={currentSession?.user?.id || ''}
              onRefresh={loadExportStats}
              refreshTrigger={historyRefreshTrigger}
            />

            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today</span>
                  <span className="text-sm font-medium">{exportStats.today}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This month</span>
                  <span className="text-sm font-medium">{exportStats.thisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total exports</span>
                  <span className="text-sm font-medium">{exportStats.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
