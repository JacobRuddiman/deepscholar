'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Calendar, Clock, Star, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFilters {
  query: string;
  categories: string[];
  models: string[];
  dateRange: 'all' | 'week' | 'month' | 'year';
  readTimeRange: 'all' | 'short' | 'medium' | 'long';
  ratingRange: 'all' | '4+' | '3+' | '2+';
  sortBy: 'relevance' | 'date' | 'rating' | 'views';
}

interface EnhancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  categories?: Array<{ id: string; name: string; count: number }>;
  models?: Array<{ id: string; name: string; count: number }>;
  isLoading?: boolean;
}

const defaultFilters: SearchFilters = {
  query: '',
  categories: [],
  models: [],
  dateRange: 'all',
  readTimeRange: 'all',
  ratingRange: 'all',
  sortBy: 'relevance',
};

export default function EnhancedSearch({
  onSearch,
  initialFilters = {},
  categories = [],
  models = [],
  isLoading = false,
}: EnhancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock search suggestions - in a real app, this would come from an API
  const mockSuggestions = [
    'machine learning',
    'artificial intelligence',
    'quantum computing',
    'climate change',
    'renewable energy',
    'blockchain technology',
    'neural networks',
    'data science',
  ];

  useEffect(() => {
    if (filters.query.length > 2) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(filters.query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [filters.query]);

  const handleFilterChange = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleArrayFilterToggle = (key: 'categories' | 'models', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters = { ...defaultFilters, query: filters.query };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.models.length > 0 ||
      filters.dateRange !== 'all' ||
      filters.readTimeRange !== 'all' ||
      filters.ratingRange !== 'all' ||
      filters.sortBy !== 'relevance'
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleFilterChange('query', suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Main Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search briefs by title, content, or keywords..."
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          {filters.query && (
            <button
              onClick={() => handleFilterChange('query', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center">
                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Filters and Advanced Toggle */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Sort By */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {filters.categories.length + filters.models.length + 
               (filters.dateRange !== 'all' ? 1 : 0) +
               (filters.readTimeRange !== 'all' ? 1 : 0) +
               (filters.ratingRange !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.name)}
                        onChange={() => handleArrayFilterToggle('categories', category.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {category.name} ({category.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Models */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Models
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {models.map((model) => (
                    <label key={model.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.models.includes(model.name)}
                        onChange={() => handleArrayFilterToggle('models', model.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {model.name} ({model.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value as SearchFilters['dateRange'])}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="all">All time</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="year">Past year</option>
                </select>
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Read Time
                </label>
                <select
                  value={filters.readTimeRange}
                  onChange={(e) => handleFilterChange('readTimeRange', e.target.value as SearchFilters['readTimeRange'])}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="all">Any length</option>
                  <option value="short">Short (1-5 min)</option>
                  <option value="medium">Medium (5-15 min)</option>
                  <option value="long">Long (15+ min)</option>
                </select>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star className="inline h-4 w-4 mr-1" />
                Minimum Rating
              </label>
              <div className="flex gap-4">
                {['all', '2+', '3+', '4+'].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filters.ratingRange === rating}
                      onChange={(e) => handleFilterChange('ratingRange', e.target.value as SearchFilters['ratingRange'])}
                      className="text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {rating === 'all' ? 'Any rating' : `${rating} stars`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {category}
                <button
                  onClick={() => handleArrayFilterToggle('categories', category)}
                  className="ml-1 hover:text-blue-600"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.models.map((model) => (
              <span
                key={model}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {model}
                <button
                  onClick={() => handleArrayFilterToggle('models', model)}
                  className="ml-1 hover:text-green-600"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {filters.dateRange}
                <button
                  onClick={() => handleFilterChange('dateRange', 'all')}
                  className="ml-1 hover:text-purple-600"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.readTimeRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                {filters.readTimeRange} read
                <button
                  onClick={() => handleFilterChange('readTimeRange', 'all')}
                  className="ml-1 hover:text-orange-600"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.ratingRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {filters.ratingRange} stars
                <button
                  onClick={() => handleFilterChange('ratingRange', 'all')}
                  className="ml-1 hover:text-yellow-600"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
