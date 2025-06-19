/**
 * Search Query Selector Component
 * 
 * Allows users to enter search queries and view previous searches for export
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, Trash2, Plus } from 'lucide-react';

interface SearchQuery {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
}

interface SearchQuerySelectorProps {
  selectedQuery: string;
  onSelectQuery: (query: string) => void;
}

export default function SearchQuerySelector({ selectedQuery, onSelectQuery }: SearchQuerySelectorProps) {
  const [currentQuery, setCurrentQuery] = useState(selectedQuery);
  const [recentSearches, setRecentSearches] = useState<SearchQuery[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'recent'>('new');

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    setCurrentQuery(selectedQuery);
  }, [selectedQuery]);

  const loadRecentSearches = () => {
    // Load from localStorage for demo purposes
    // In a real app, this would come from the database
    try {
      const saved = localStorage.getItem('deepscholar_recent_searches');
      if (saved) {
        const searches = JSON.parse(saved).map((search: any) => ({
          ...search,
          timestamp: new Date(search.timestamp)
        }));
        setRecentSearches(searches);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const newSearch: SearchQuery = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      resultCount: Math.floor(Math.random() * 50) + 1 // Mock result count
    };

    const updatedSearches = [newSearch, ...recentSearches.filter(s => s.query !== query.trim())]
      .slice(0, 10); // Keep only last 10 searches

    setRecentSearches(updatedSearches);
    
    // Save to localStorage
    try {
      localStorage.setItem('deepscholar_recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const handleQuerySubmit = () => {
    if (currentQuery.trim()) {
      saveRecentSearch(currentQuery);
      onSelectQuery(currentQuery.trim());
    }
  };

  const handleSelectRecentSearch = (query: string) => {
    setCurrentQuery(query);
    onSelectQuery(query);
    setActiveTab('new');
  };

  const handleDeleteRecentSearch = (searchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedSearches = recentSearches.filter(s => s.id !== searchId);
    setRecentSearches(updatedSearches);
    
    try {
      localStorage.setItem('deepscholar_recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to update recent searches:', error);
    }
  };

  const clearAllSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('deepscholar_recent_searches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const popularQueries = [
    'machine learning',
    'climate change',
    'quantum computing',
    'artificial intelligence',
    'renewable energy',
    'gene editing',
    'neural networks',
    'biotechnology'
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'new'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New Search
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recent ({recentSearches.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Enter search query
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Enter search terms..."
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleQuerySubmit}
                disabled={!currentQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Use Query
              </button>
            </div>
          </div>

          {/* Popular Queries */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Popular search queries
            </label>
            <div className="flex flex-wrap gap-2">
              {popularQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    setCurrentQuery(query);
                    onSelectQuery(query);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection */}
          {selectedQuery && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Selected query:</span>
                <span className="text-sm text-blue-800">"{selectedQuery}"</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recent Searches Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {recentSearches.length} recent search{recentSearches.length !== 1 ? 'es' : ''}
            </span>
            {recentSearches.length > 0 && (
              <button
                onClick={clearAllSearches}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Recent Searches List */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            {recentSearches.length > 0 ? (
              recentSearches.map((search) => (
                <div
                  key={search.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedQuery === search.query ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleSelectRecentSearch(search.query)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          "{search.query}"
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{search.timestamp.toLocaleDateString()}</span>
                        </div>
                        {search.resultCount && (
                          <span>{search.resultCount} results</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteRecentSearch(search.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No recent searches</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your search history will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
