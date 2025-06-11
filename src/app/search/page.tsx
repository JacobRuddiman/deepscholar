'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Grid, List, Loader2 } from 'lucide-react';
import SearchBar from '@/app/components/SearchBar';
import BriefCard from '@/app/components/brief_card';
import { searchBriefs } from '@/server/actions/briefs';

interface SearchResult {
  id: string;
  title: string;
  abstract: string;
  model: string;
  date: string;
  readTime: string;
  category: string;
  views: number;
  rating?: number;
  reviewCount?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalResults, setTotalResults] = useState(0);

  // Get search parameters and memoize them to prevent unnecessary re-renders
  const searchParamsObj = useMemo(() => {
    const query = searchParams.get('q') ?? '';
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',') : [];
    const model = searchParams.get('model') ?? '';
    const sort = searchParams.get('sort') ?? 'popular';
    const date = searchParams.get('date') ?? 'all';
    const time = searchParams.get('time') ?? 'all';
    const rating = searchParams.get('rating') ?? 'all';
    
    return { query, categories, model, sort, date, time, rating };
  }, [searchParams]);

  const { query, categories, model, sort, date, time, rating } = searchParamsObj;

  // Real search function using database
  const performSearch = async () => {
    console.log('SearchPage: performSearch called with params:', {
      query, categories, model, sort, date, time, rating
    });
    setIsLoading(true);
    
    try {
      const searchResult = await searchBriefs({
        query,
        categories: categories.length > 0 ? categories : undefined,
        model: model !== 'All Models' ? model : undefined,
        sortBy: sort as 'popular' | 'new' | 'controversial',
        dateRange: date as 'all' | 'today' | 'week' | 'month' | 'year',
        rating: rating as 'all' | '4+' | '3+' | '2+',
        page: 1,
        limit: 20
      });

      if (searchResult.success && searchResult.data) {
        setResults(searchResult.data.results);
        setTotalResults(searchResult.data.totalCount);
      } else {
        console.error('Search failed:', searchResult.error);
        setResults([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search when parameters change - allow empty query to see all briefs
  useEffect(() => {
    void performSearch();
  }, [searchParamsObj]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            placeholder="Search research briefs..."
            showFilters={true}
            size="lg"
          />
        </div>

        {/* Search Results Header */}
        {query && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results for &ldquo;{query}&rdquo;
                </h1>
                <p className="text-gray-600 mt-1">
                  {isLoading ? 'Searching...' : `${totalResults} results found`}
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(categories.length > 0 || model || sort !== 'popular' || date !== 'all' || time !== 'all' || rating !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-500">Filters:</span>
                {categories.map(category => (
                  <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {category}
                  </span>
                ))}
                {model && model !== 'All Models' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {model}
                  </span>
                )}
                {sort !== 'popular' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Sort: {sort}
                  </span>
                )}
                {date !== 'all' && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {date}
                  </span>
                )}
                {time !== 'all' && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                    {time} read
                  </span>
                )}
                {rating !== 'all' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    {rating} stars
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {/* No Results */}
        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you&rsquo;re looking for.
            </p>
            <button 
              onClick={() => window.location.href = '/search'}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search and start over
            </button>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }
            `}
          >
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={viewMode === 'list' ? 'w-full' : ''}
              >
                <BriefCard
                  id={result.id}
                  title={result.title}
                  abstract={result.abstract}
                  model={result.model}
                  date={result.date}
                  readTime={result.readTime}
                  category={result.category}
                  views={result.views}
                  rating={result.rating}
                  reviewCount={result.reviewCount}
                  compact={viewMode === 'list'}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && results.length > 0 && totalResults > 10 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}

        {/* No Query State - Show results even without query */}
        {!query && !isLoading && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Research Briefs</h3>
            <p className="text-gray-600">
              Showing all available research briefs. Use the search bar above to filter results.
            </p>
          </div>
        )}

        {/* Show results even when no query */}
        {!query && !isLoading && results.length > 0 && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">All Research Briefs</h1>
            <p className="text-gray-600">
              {totalResults} briefs available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
