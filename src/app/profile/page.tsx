"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Book, 
  Star, 
  ThumbsUp, 
  Clock, 
  Bookmark,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Award,
  Coins,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getUserBriefs } from '@/server/actions/briefs';

type ActivityType = 'all' | 'briefs' | 'reviews' | 'upvotes' | 'saves';
type TimeFilter = 'all' | 'week' | 'month' | 'year';

type Brief = {
  id: string;
  title: string;
  abstract: string | null;
  createdAt: Date;
  upvotes: any[];
  reviews: any[];
  categories: { name: string }[];
  model: {
    name: string;
    provider: string;
  };
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUserBriefs();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setBriefs(result.data);
    } catch (error) {
      setError('Failed to load briefs. Please try again later.');
      console.error('Error loading briefs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from actual data
  const stats = {
    briefs: briefs.length,
    reviews: briefs.reduce((acc, brief) => acc + brief.reviews.length, 0),
    upvotes: briefs.reduce((acc, brief) => acc + brief.upvotes.length, 0),
    savedBriefs: 0, // TODO: Implement saved briefs functionality
    tokenBalance: 550 // TODO: Implement token balance functionality
  };

  const activityTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'upvotes', label: 'Upvotes' },
    { id: 'saves', label: 'Saved' }
  ];

  const timeFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
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
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <img
              src={session?.user?.image || '/default-avatar.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-blue-100"
            />
            <div className="ml-6">
              <h1 className="text-3xl font-bold">{session?.user?.name}</h1>
              <p className="text-gray-600">{session?.user?.email}</p>
              <div className="flex items-center mt-2">
                <Award className="text-yellow-500 w-5 h-5 mr-2" />
                <span className="text-sm text-gray-600">Top Contributor</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center justify-center bg-blue-50 rounded-full w-12 h-12 mb-1">
                <Coins className="text-blue-600 w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">{stats.tokenBalance}</p>
              <p className="text-xs text-gray-500">Tokens</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center bg-green-50 rounded-full w-12 h-12 mb-1">
                <TrendingUp className="text-green-600 w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">{stats.upvotes}</p>
              <p className="text-xs text-gray-500">Upvotes</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Book className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.briefs}</p>
            <p className="text-sm text-gray-600">Briefs</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.reviews}</p>
            <p className="text-sm text-gray-600">Reviews</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.upvotes}</p>
            <p className="text-sm text-gray-600">Upvotes</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Bookmark className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.savedBriefs}</p>
            <p className="text-sm text-gray-600">Saved</p>
          </div>
        </div>
      </div>

      {/* Recent Briefs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Briefs</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-6">
          {briefs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No briefs found.</p>
          ) : (
            briefs.map((brief) => (
              <motion.div
                key={brief.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b pb-6 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                      {brief.title}
                    </h3>
                    {brief.abstract && (
                      <p className="text-gray-600 text-sm mb-3">{brief.abstract}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {brief.upvotes.length} upvotes
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {brief.reviews.length} reviews
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(brief.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {brief.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Activity</h2>
          <div className="flex items-center space-x-4">
            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-sm"
            >
              {timeFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="border-b mb-6">
          <div className="flex space-x-6">
            {activityTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActivityType)}
                className={`pb-4 text-sm font-medium relative ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Content */}
        <div className="space-y-4">
          {briefs.map((brief) => (
            <div key={brief.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="bg-blue-100 rounded-full p-2">
                <Book className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm">
                  Created a new brief: <span className="font-medium">{brief.title}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(brief.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 