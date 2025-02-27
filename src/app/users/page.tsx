'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';
import UserCard from '@/components/UserCard';
import { getUsers } from '../../server/actions/users';

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  _count: {
    briefs: number;
    reviews: number;
    briefUpvotes: number;
    savedBriefs: number;
  };
  tokenBalance: {
    balance: number;
  } | null;
};

type SortOption = {
  label: string;
  value: 'name' | 'briefs' | 'reviews' | 'upvotes';
};

const sortOptions: SortOption[] = [
  { label: 'Name', value: 'name' },
  { label: 'Briefs', value: 'briefs' },
  { label: 'Reviews', value: 'reviews' },
  { label: 'Upvotes', value: 'upvotes' },
];

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption['value']>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Handle search query debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load users when search or sort changes
  useEffect(() => {
    loadUsers();
  }, [debouncedQuery, sortBy, sortDir, page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getUsers({
        query: debouncedQuery,
        page,
        limit: 10,
        orderBy: sortBy,
        orderDir: sortDir,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load users data');
      }

      setUsers(result.data.users);
      setTotalPages(result.data.pagination.pages);
    } catch (error) {
      setError('Failed to load users. Please try again later.');
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    router.push(`/users${searchQuery ? `?q=${searchQuery}` : ''}`);
  };

  const handleSort = (option: SortOption['value']) => {
    if (sortBy === option) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDir('asc');
    }
    setPage(1);
    setShowSortMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        
        {/* Search and Sort */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </form>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Sort</span>
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSort(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === option.value ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <span className="float-right">
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="space-y-6">
        {users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No users found.</p>
        ) : (
          users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <UserCard user={user} />
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 