"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Book, 
  Star, 
  ThumbsUp, 
  Clock, 
  Bookmark,
  MessageSquare,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { getUserProfile } from '@/server/actions/users';
import Link from 'next/link';

type ActivityType = 'all' | 'briefs' | 'reviews' | 'upvotes' | 'saves';
type TimeFilter = 'all' | 'week' | 'month' | 'year';

type UserProfile = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  createdAt: Date;
  briefs: Array<{
    id: string;
    title: string;
    abstract: string | null;
    createdAt: Date;
    categories: { name: string }[];
    model: {
      name: string;
      provider: string;
    };
    upvotes: Array<{ id: string; userId: string; briefId: string; createdAt: Date }>;
    reviews: Array<{ id: string; content: string; rating: number; createdAt: Date }>;
  }>;
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    brief: {
      id: string;
      title: string;
      slug: string | null;
    };
  }>;
  briefUpvotes: Array<{
    id: string;
    createdAt: Date;
    brief: {
      id: string;
      title: string;
      slug: string | null;
    };
  }>;
  _count: {
    briefs: number;
    reviews: number;
    briefUpvotes: number;
  };
  upvotesReceived: number;
  averageScore: number;
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getUserProfile(userId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'User not found');
      }
      
      setUser(result.data);
    } catch (error) {
      setError('Failed to load user profile. Please try again later.');
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activityTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'upvotes', label: 'Upvotes' }
  ];

  const timeFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];

  const filterByTime = (items: any[], timeFilter: TimeFilter) => {
    if (timeFilter === 'all') return items;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeFilter) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return items.filter(item => new Date(item.createdAt) >= cutoff);
  };

  const getActivityContent = () => {
    if (!user) return null;
    
    const filteredBriefs = filterByTime(user.briefs, timeFilter);

    switch (activeTab) {
      case 'briefs':
        return filteredBriefs.map((brief) => (
          <ActivityItem
            key={`brief-${brief.id}`}
            icon={<Book className="w-4 h-4 text-blue-600" />}
            title={`Created: ${brief.title}`}
            date={brief.createdAt}
            link={`/briefs/${brief.id}`}
          />
        ));
      
      case 'reviews':
        const filteredReviews = filterByTime(user.reviews, timeFilter);
        return filteredReviews.length > 0 ? filteredReviews.map((review) => (
          <ActivityItem
            key={`review-${review.id}`}
            icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
            title={`Reviewed: ${review.brief.title} (${review.rating}/5 stars)`}
            date={review.createdAt}
            link={`/briefs/${review.brief.slug || review.brief.id}`}
          />
        )) : (
          <div className="text-center text-gray-500 py-8">
            No reviews found
          </div>
        );
      
      case 'upvotes':
        const filteredUpvotes = filterByTime(user.briefUpvotes, timeFilter);
        return filteredUpvotes.length > 0 ? filteredUpvotes.map((upvote) => (
          <ActivityItem
            key={`upvote-${upvote.id}`}
            icon={<ThumbsUp className="w-4 h-4 text-blue-600" />}
            title={`Upvoted: ${upvote.brief.title}`}
            date={upvote.createdAt}
            link={`/briefs/${upvote.brief.slug || upvote.brief.id}`}
          />
        )) : (
          <div className="text-center text-gray-500 py-8">
            No upvotes found
          </div>
        );
      
      case 'saves':
        return (
          <div className="text-center text-gray-500 py-8">
            Saved briefs not available for other users
          </div>
        );
      
      case 'all':
      default:
        return filteredBriefs.map((brief) => (
          <ActivityItem
            key={`brief-${brief.id}`}
            icon={<Book className="w-4 h-4 text-blue-600" />}
            title={`Created: ${brief.title}`}
            date={brief.createdAt}
            link={`/briefs/${brief.id}`}
          />
        ));
    }
  };

  const ActivityItem = ({ icon, title, date, link }: {
    icon: React.ReactNode;
    title: string;
    date: Date;
    link?: string;
  }) => (
    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="bg-gray-100 rounded-full p-2">
        {icon}
      </div>
      <div className="flex-1">
        {link ? (
          <Link href={link} className="text-sm hover:text-blue-600 transition-colors">
            {title}
          </Link>
        ) : (
          <p className="text-sm">{title}</p>
        )}
        <p className="text-xs text-gray-500">
          {new Date(date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  const PlaceholderAvatar = ({ size = 96 }: { size?: number }) => (
    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100`}>
      <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#E5E7EB"/>
        <circle cx="75" cy="60" r="25" fill="#9CA3AF"/>
        <path d="M75 95C95 95 115 105 115 125V150H35V125C35 105 55 95 75 95Z" fill="#9CA3AF"/>
      </svg>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Link href="/users" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-blue-100"
              />
            ) : (
              <PlaceholderAvatar size={96} />
            )}
            
            <div className="ml-6">
              <h1 className="text-3xl font-bold">{user.name || 'Anonymous User'}</h1>
              <p className="text-gray-600">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              <div className="flex items-center mt-2">
                <Award className="text-yellow-500 w-5 h-5 mr-2" />
                <span className="text-sm text-gray-600">
                  {user.averageScore > 4.5 ? 'Top Contributor' : 'Contributor'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center justify-center bg-green-50 rounded-full w-12 h-12 mb-1">
                <Star className="text-green-600 w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">
                {user.averageScore > 0 ? user.averageScore.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Book className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{user._count.briefs}</p>
            <p className="text-sm text-gray-600">Briefs</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{user._count.reviews}</p>
            <p className="text-sm text-gray-600">Reviews</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{user.upvotesReceived}</p>
            <p className="text-sm text-gray-600">Upvotes Received</p>
          </div>
        </div>
      </div>

      {/* Recent Briefs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Briefs</h2>
        </div>
        <div className="space-y-6">
          {user.briefs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No briefs found.</p>
          ) : (
            user.briefs.map((brief) => (
              <motion.div
                key={brief.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b pb-6 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/briefs/${brief.id}`}>
                      <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                        {brief.title}
                      </h3>
                    </Link>
                    {brief.abstract && (
                      <p className="text-gray-600 text-sm mb-3">{brief.abstract}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(brief.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Book className="w-4 h-4 mr-1" />
                        {brief.model.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
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
                    {brief.reviews.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                        <span>
                          {(brief.reviews.reduce((sum, review) => sum + review.rating, 0) / brief.reviews.length).toFixed(1)} ({brief.reviews.length})
                        </span>
                      </div>
                    )}
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
            {/* Time Filter Dropdown */}
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
          {getActivityContent()}
        </div>
      </div>
    </div>
  );
}
