'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Clock, 
  Star, 
  Tag, 
  ChevronDown,
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';
import { searchParamsSchema } from '@/lib/validation';

interface SearchFilters {
  query: string;
  categories: string[];
  modelFilter: string;
  sortBy: 'popular' | 'new' | 'controversial';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  readingTime: 'all' | 'short' | 'medium' | 'long';
  rating: 'all' | '4+' | '3+' | '2+';
  searchFullContent: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'category' | 'trending';
  count?: number;
}

interface SearchBarProps {
  placeholder?: string;
  showFilters?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const categories = [
  'Computer Science',
  'AI & Machine Learning',
  'Physics',
  'Biology',
  'Medicine',
  'Economics',
  'Social Sciences',
  'Mathematics',
  'Chemistry',
  'Psychology'
];

const models = [
  'All Models',
  'OpenAI',
  'Anthropic',
  'Perplexity',
  'Other'
];

const trendingSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'artificial intelligence', type: 'trending', count: 156 },
  { id: '2', text: 'machine learning', type: 'trending', count: 142 },
  { id: '3', text: 'quantum computing', type: 'trending', count: 89 },
  { id: '4', text: 'climate change', type: 'trending', count: 76 },
  { id: '5', text: 'neural networks', type: 'trending', count: 65 }
];

function SearchBar({ 
  placeholder = "Search research briefs...", 
  showFilters = true,
  onSearch,
  className = '',
  size = 'md'
}: SearchBarProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    modelFilter: 'All Models',
    sortBy: 'popular',
    dateRange: 'all',
    readingTime: 'all',
    rating: 'all',
    searchFullContent: false
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deepscholar-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('deepscholar-recent-searches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    console.log('SearchBar: Starting search with filters:', filters);
    setIsLoading(true);
    saveRecentSearch(filters.query);

    try {
      // Validate search parameters
      const validatedParams = searchParamsSchema.parse({
        query: filters.query,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        modelFilter: filters.modelFilter !== 'All Models' ? filters.modelFilter : undefined,
        sortBy: filters.sortBy,
      });

      if (onSearch) {
        onSearch(filters);
      } else {
        // Navigate to search results page
        const searchParams = new URLSearchParams();
        searchParams.set('q', filters.query);
        
        if (filters.categories.length > 0) {
          searchParams.set('categories', filters.categories.join(','));
        }
        if (filters.modelFilter !== 'All Models') {
          searchParams.set('model', filters.modelFilter);
        }
        if (filters.sortBy !== 'popular') {
          searchParams.set('sort', filters.sortBy);
        }
        if (filters.dateRange !== 'all') {
          searchParams.set('date', filters.dateRange);
        }
        if (filters.readingTime !== 'all') {
          searchParams.set('time', filters.readingTime);
        }
        if (filters.rating !== 'all') {
          searchParams.set('rating', filters.rating);
        }
        if (filters.searchFullContent) {
          searchParams.set('fullContent', 'true');
        }

        router.push(`/search?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error('Search validation error:', error);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, query: suggestion.text }));
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Clear all filters (but keep the search query)
  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      categories: [],
      modelFilter: 'All Models',
      sortBy: 'popular',
      dateRange: 'all',
      readingTime: 'all',
      rating: 'all',
      searchFullContent: false
    }));
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const searchContainerClasses = `
    flex items-center bg-white border-2 rounded-lg shadow-sm transition-all duration-200
    ${isExpanded ? 'border-blue-500 shadow-lg' : 'border-gray-300 hover:border-gray-400'}
    ${sizeClasses[size]}
  `;

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className={searchContainerClasses}>
          <div className="flex-1 flex items-center">
            <Search 
              className="ml-3 text-gray-400" 
              size={iconSizes[size]} 
            />
            <input
              ref={searchInputRef}
              type="text"
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onFocus={() => {
                setShowSuggestions(true);
                setIsExpanded(false); // Close filters when suggestions open
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
            />
            
            {filters.query && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={iconSizes[size] - 4} />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex items-center border-l border-gray-200">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Filter size={iconSizes[size] - 4} />
                <ChevronDown 
                  className={`ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  size={iconSizes[size] - 8} 
                />
              </button>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={!filters.query.trim() || isLoading}
            className={`px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors ${sizeClasses[size]}`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={iconSizes[size] - 4} />
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <History size={14} className="mr-1" />
                    Recent Searches
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick({ id: `recent-${index}`, text: search, type: 'query' })}
                        className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div className="p-3">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <TrendingUp size={14} className="mr-1" />
                  Trending Searches
                </div>
                <div className="space-y-1">
                  {trendingSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center justify-between w-full px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      <span>{suggestion.text}</span>
                      <span className="text-xs text-gray-400">{suggestion.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            {/* Search Scope Toggle */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.searchFullContent}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchFullContent: e.target.checked }))}
                  className="mr-2 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Search full content (abstracts & responses)
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {filters.searchFullContent ? 'Searching titles, abstracts, and full content' : 'Searching titles only'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={14} className="inline mr-1" />
                  Categories
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-600">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Model Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={filters.modelFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, modelFilter: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'popular' | 'new' | 'controversial' }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="popular">Most Popular</option>
                  <option value="new">Newest</option>
                  <option value="controversial">Most Controversial</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as 'all' | 'today' | 'week' | 'month' | 'year' }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Reading Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  Reading Time
                </label>
                <select
                  value={filters.readingTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, readingTime: e.target.value as 'all' | 'short' | 'medium' | 'long' }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Any Length</option>
                  <option value="short">Short (&lt; 5 min)</option>
                  <option value="medium">Medium (5-15 min)</option>
                  <option value="long">Long (&gt; 15 min)</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star size={14} className="inline mr-1" />
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value as 'all' | '4+' | '3+' | '2+' }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Any Rating</option>
                  <option value="4+">4+ Stars</option>
                  <option value="3+">3+ Stars</option>
                  <option value="2+">2+ Stars</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All Filters
              </button>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {filters.categories.length > 0 && `${filters.categories.length} categories, `}
                  {filters.modelFilter !== 'All Models' && `${filters.modelFilter}, `}
                  {filters.sortBy !== 'popular' && `${filters.sortBy}, `}
                  {filters.dateRange !== 'all' && `${filters.dateRange}, `}
                  {filters.readingTime !== 'all' && `${filters.readingTime}, `}
                  {filters.rating !== 'all' && `${filters.rating}`}
                </span>
                
                <button
                  onClick={handleSearch}
                  disabled={!filters.query.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    'Update Results'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
