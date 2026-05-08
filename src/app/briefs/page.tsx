'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BriefCard from '../components/brief_card';
import { Filter, SortAsc, SortDesc, Search, X, ChevronDown, Grid, List, Download } from 'lucide-react';
import { calculateAverageRating, calculateReadTime, formatBriefDate } from '@/lib/brief-utils';
import Link from 'next/link';
import { useBriefs } from '@/hooks/queries/useBriefs';
import { useCategories } from '@/hooks/queries/useCategories';
import { useModels } from '@/hooks/queries/useModels';

type Brief = {
  id: string;
  title: string;
  abstract: string | null;
  response: string;
  slug: string | null;
  viewCount: number;
  createdAt: Date;
  categories: { name: string }[];
  model: { name: string };
  author: { name: string | null; image: string | null };
  upvotes: unknown[];
  reviews: { rating: number }[];
};

type Category = {
  id: string;
  name: string;
  _count: { briefs: number };
};

type Model = {
  id: string;
  name: string;
  _count: { briefs: number };
};

const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-3" />
        <div className="h-3 bg-gray-200 rounded mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    ))}
  </div>
);

const ExploreBriefsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'new' | 'controversial'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // React Query hooks replace manual fetching
  const briefsQuery = useBriefs({
    page,
    sortBy,
    categories: selectedCategories,
    search: searchQuery,
    modelFilter: selectedModel
  });

  const categoriesQuery = useCategories();
  const modelsQuery = useModels();

  // Extract data from queries
  const briefs = briefsQuery.data?.data || [];
  const totalPages = briefsQuery.data?.totalPages || 1;
  const total = briefsQuery.data?.total || 0;
  const loading = briefsQuery.isLoading;
  const error = briefsQuery.error?.message || null;

  const categories = categoriesQuery.data || [];
  const models = modelsQuery.data || [];

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') as 'popular' | 'new' | 'controversial' || 'popular';
    const category = searchParams.get('category');
    const model = searchParams.get('model') || '';

    setSearchQuery(search);
    setSortBy(sort);
    setSelectedModel(model);
    if (category) {
      setSelectedCategories([category]);
    }
  }, [searchParams]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (selectedCategories.length === 1) params.set('category', selectedCategories[0]!);
    if (selectedModel) params.set('model', selectedModel);
    
    const newURL = `/briefs${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setPage(1);
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
    setPage(1);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setPage(1);
  };

  const handleSortChange = (newSort: 'popular' | 'new' | 'controversial') => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'new': return 'Newest First';
      case 'controversial': return 'Controversial';
      case 'popular': 
      default: return 'Most Popular';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Explore Research Briefs</h1>
            <Link
              href="/export"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </Link>
          </div>
          <p className="text-gray-600">
            Discover AI-generated research insights from leading models across various fields
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search briefs by title, content, or abstract..."
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="new">Newest First</option>
                  <option value="controversial">Controversial</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Model Filter */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Models</option>
                  {models.map(model => (
                    <option key={model.id} value={model.name}>
                      {model.name} ({model._count.briefs})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Categories
                {selectedCategories.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
            </div>

            {/* Right side - View Mode and Results Count */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${total} results`}
              </span>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Categories</h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={handleClearCategories}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.name)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategories.includes(category.name)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name} ({category._count.briefs})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              onClick={() => router.refresh()}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No briefs found matching your criteria.</div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategories([]);
                setSelectedModel('');
                setSortBy('popular');
                setPage(1);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {briefs.map(brief => {
              const reviewCount = brief.reviews?.length ?? 0;
              const averageRating = calculateAverageRating(brief.reviews);

              return (
                <BriefCard
                  key={brief.id}
                  id={brief.id}
                  title={brief.title}
                  abstract={brief.abstract ?? ''}
                  model={brief.model.name}
                  date={formatBriefDate(brief.createdAt)}
                  readTime={`${calculateReadTime(brief.response)} min`}
                  category={brief.categories[0]?.name ?? 'General'}
                  views={brief.viewCount}
                  rating={averageRating}
                  reviewCount={reviewCount}
                  _slug={brief.slug ?? undefined}
                  compact={viewMode === 'list'}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function BriefsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse" />}>
      <ExploreBriefsPage />
    </Suspense>
  );
}

export default BriefsPageWrapper;
