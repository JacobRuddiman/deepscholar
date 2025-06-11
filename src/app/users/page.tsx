'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTopContributors } from '@/server/actions/users';
import { Search, Trophy, Star, TrendingUp, Users, ChevronDown, Grid, List } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Contributor = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  createdAt: Date;
  _count: {
    briefs: number;
    reviews: number;
    briefUpvotes: number;
  };
  briefs: Array<{
    id: string;
    slug: string | null;
    title: string;
    viewCount: number;
    reviews: Array<{
      rating: number;
    }>;
  }>;
  averageRating: number;
  totalViews: number;
};

const UsersPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'briefs' | 'rating' | 'views' | 'recent'>('briefs');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('search') ?? '';
    const sort = searchParams.get('sort') as 'briefs' | 'rating' | 'views' | 'recent' ?? 'briefs';
    
    setSearchQuery(search);
    setSortBy(sort);
  }, [searchParams]);

  // Fetch contributors
  useEffect(() => {
    const fetchContributors = async () => {
      setLoading(true);
      setError(null);
      
      const result = await getTopContributors({
        page,
        sortBy,
        search: searchQuery
      });
      
      if (result.success && result.data) {
        setContributors(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        setError('Failed to load users');
      }
      setLoading(false);
    };
    void fetchContributors();
  }, [page, sortBy, searchQuery]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'briefs') params.set('sort', sortBy);
    
    const newURL = `/users${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL();
  };

  const handleSortChange = (newSort: 'briefs' | 'rating' | 'views' | 'recent') => {
    setSortBy(newSort);
    setPage(1);
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'briefs': return 'Most Briefs';
      case 'rating': return 'Highest Rated';
      case 'views': return 'Most Views';
      case 'recent': return 'Most Recent';
      default: return 'Most Briefs';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-500 font-semibold">#{index + 1}</span>;
  };

  const ContributorCard = ({ contributor, index }: { contributor: Contributor; index: number }) => {
    const briefHref = `/briefs/${contributor.briefs[0]?.id}`;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
            {getRankIcon(index)}
          </div>
          
          {/* Avatar */}
          <div className="flex-shrink-0">
            {contributor.image ? (
              <Image
                src={contributor.image}
                alt={contributor.name ?? 'User'}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <svg width="48" height="48" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="75" cy="75" r="75" fill="#E5E7EB"/>
                  <circle cx="75" cy="60" r="25" fill="#9CA3AF"/>
                  <path d="M75 95C95 95 115 105 115 125V150H35V125C35 105 55 95 75 95Z" fill="#9CA3AF"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/profile/${contributor.id}`} className="hover:text-blue-600 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {contributor.name ?? 'Anonymous User'}
                </h3>
              </Link>
              {contributor.averageRating > 4.5 && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Briefs</span>
                <p className="font-semibold text-gray-900">{contributor._count.briefs}</p>
              </div>
              <div>
                <span className="text-gray-500">Avg Rating</span>
                <p className="font-semibold text-gray-900">
                  {contributor.averageRating > 0 ? contributor.averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Views</span>
                <p className="font-semibold text-gray-900">{contributor.totalViews.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Joined</span>
                <p className="font-semibold text-gray-900">
                  {new Date(contributor.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {/* Top Brief */}
            {contributor.briefs.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Top Brief</p>
                <Link 
                  href={briefHref}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                >
                  {contributor.briefs[0]?.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {contributor.briefs[0]?.viewCount.toLocaleString()} views
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ContributorListItem = ({ contributor, index }: { contributor: Contributor; index: number }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-12 flex items-center justify-center">
          {getRankIcon(index)}
        </div>
        
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contributor.image ? (
            <Image
              src={contributor.image}
              alt={contributor.name ?? 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
          )}
        </div>
        
        {/* Name */}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${contributor.id}`} className="hover:text-blue-600 transition-colors">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {contributor.name ?? 'Anonymous User'}
            </h3>
          </Link>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{contributor._count.briefs}</p>
            <p className="text-gray-500">Briefs</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {contributor.averageRating > 0 ? contributor.averageRating.toFixed(1) : 'N/A'}
            </p>
            <p className="text-gray-500">Rating</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{contributor.totalViews.toLocaleString()}</p>
            <p className="text-gray-500">Views</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">
            Discover the researchers and experts who are driving innovation on DeepScholar
          </p>
        </div>
        
        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as 'briefs' | 'rating' | 'views' | 'recent')}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="briefs">Most Briefs</option>
                  <option value="rating">Highest Rated</option>
                  <option value="views">Most Views</option>
                  <option value="recent">Most Recent</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Results Count */}
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {loading ? 'Loading...' : `${total} users`}
              </span>
              
              {/* View Mode */}
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
        </div>

        {/* Results */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : contributors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No users found.</div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSortBy('briefs');
                setPage(1);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
            : 'space-y-4'
          }>
            {contributors.map((contributor, index) => 
              viewMode === 'grid' ? (
                <ContributorCard key={contributor.id} contributor={contributor} index={index} />
              ) : (
                <ContributorListItem key={contributor.id} contributor={contributor} index={index} />
              )
            )}
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

export default UsersPage;
