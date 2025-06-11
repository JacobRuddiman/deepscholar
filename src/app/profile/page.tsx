"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  Loader2
} from 'lucide-react';
import { getUserBriefs, getSavedBriefs, getUserReviews, getUserUpvotes, deleteBriefReview } from '@/server/actions/briefs';
import ErrorPopup from '../components/error_popup';

/**
 * PROFILE PAGE COMPONENT
 * 
 * This component displays a comprehensive user profile with the following sections:
 * 1. Profile Header - User avatar, name, email, and key metrics
 * 2. Stats Grid - Overview of user's activity (briefs, reviews, upvotes, saves)
 * 3. Recent Briefs - Latest briefs created by the user
 * 4. Activity Feed - Tabbed interface showing different types of user activity
 * 
 * The component handles LOCAL mode authentication automatically and provides
 * placeholder avatars for users without profile images.
 */

type ActivityType = 'all' | 'briefs' | 'reviews' | 'upvotes' | 'saves';
type TimeFilter = 'all' | 'week' | 'month' | 'year';

type Brief = {
  id: string;
  title: string;
  abstract: string | null;
  slug?: string | null;
  createdAt: Date;
  upvotes: { id: string; userId: string; briefId: string; createdAt: Date }[];
  reviews: { id: string; content: string; rating: number; createdAt: Date }[];
  categories: { name: string }[];
  model: {
    name: string;
    provider: string;
  };
};

type Review = {
  id: string;
  content: string;
  rating: number;
  createdAt: Date;
  brief: {
    id: string;
    title: string;
    slug: string | null;
  };
};

export default function ProfilePage() {
  // Session management for authentication
  const { data: session } = useSession();
  
  // State management for different data types and UI controls
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [savedBriefs, setSavedBriefs] = useState<Brief[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * INITIAL DATA LOADING
   * Fetches user's briefs and saved briefs when component mounts
   */
  useEffect(() => {
    loadUserData();
  }, []);
 
  /**
   * LOAD USER DATA
   * Fetches all user-related data including briefs and saved briefs
   * Handles both LOCAL mode and production authentication
   */
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load user's own briefs
      const briefsResult = await getUserBriefs();
      if (!briefsResult.success) {
        throw new Error(briefsResult.error);
      }
      setBriefs(briefsResult.data || []);

      // Load saved briefs
      const savedResult = await getSavedBriefs();
      if (savedResult.success && savedResult.data) {
        setSavedBriefs(savedResult.data);
      }

      // Load user's reviews
      const reviewsResult = await getUserReviews();
      if (reviewsResult.success && reviewsResult.data) {
        setReviews(reviewsResult.data);
        console.log('Loaded user reviews:', reviewsResult.data.length);
      } else {
        console.error('Failed to load user reviews:', reviewsResult.error);
        // Don't fail the entire load if reviews fail - just log the error
        setReviews([]);
      }

      // Load user's upvotes
      const upvotesResult = await getUserUpvotes();
      if (upvotesResult.success && upvotesResult.data) {
        setUserUpvotes(upvotesResult.data);
        console.log('Loaded user upvotes:', upvotesResult.data.length);
      } else {
        console.error('Failed to load user upvotes:', upvotesResult.error);
        setUserUpvotes([]);
      }

    } catch (error) {
      setError('Failed to load profile data. Please try again later.');
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * CALCULATE USER STATISTICS
   * Computes various metrics from the loaded data
   */
  const stats = {
    briefs: briefs.length,
    reviews: reviews.length, // Reviews written by user
    upvotes: briefs.reduce((acc, brief) => acc + brief.upvotes.length, 0), // Upvotes received on user's briefs
    savedBriefs: savedBriefs.length,
    tokenBalance: 550 // TODO: Implement actual token balance from database
  };

  /**
   * ACTIVITY TAB CONFIGURATION
   * Defines the different activity views available
   */
  const activityTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'upvotes', label: 'Upvotes' },
    { id: 'saves', label: 'Saved' }
  ];

  /**
   * TIME FILTER CONFIGURATION
   * Defines the time range options for filtering activity
   */
  const timeFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];

  /**
   * FILTER ACTIVITY BY TIME
   * Filters activities based on the selected time range
   */
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

  /**
   * GET ACTIVITY CONTENT
   * Returns the appropriate content based on the selected activity tab
   */
  const getActivityContent = () => {
    const filteredBriefs = filterByTime(briefs, timeFilter);
    const filteredSaved = filterByTime(savedBriefs, timeFilter);
    const filteredReviews = filterByTime(reviews, timeFilter);

    switch (activeTab) {
      case 'briefs':
        return filteredBriefs.map((brief) => (
          <ActivityItem
            key={`brief-${brief.id}`}
            icon={<Book className="w-4 h-4 text-blue-600" />}
            title={`Created a new brief: ${brief.title}`}
            date={brief.createdAt}
            link={`/briefs/${brief.id}`}
          />
        ));
      
      case 'saves':
        return filteredSaved.map((brief) => (
          <ActivityItem
            key={`saved-${brief.id}`}
            icon={<Bookmark className="w-4 h-4 text-red-600" />}
            title={`Saved brief: ${brief.title}`}
            date={brief.createdAt}
            link={`/briefs/${brief.id}`}
          />
        ));
      
      case 'reviews':
        return filteredReviews.map((review) => (
          <ActivityItem
            key={`review-${review.id}`}
            icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
            title={`Reviewed: ${review.brief.title}`}
            date={review.createdAt}
            link={`/briefs/${review.brief.id}`}
          />
        ));
      
      case 'upvotes':
        // Show both upvotes received and given
        const filteredUserUpvotes = filterByTime(userUpvotes, timeFilter);
        const upvotedBriefs = filteredBriefs.filter(brief => brief.upvotes.length > 0);
        
        const allUpvoteActivities = [
          // Upvotes received on user's briefs
          ...upvotedBriefs.map((brief) => ({
            type: 'received',
            id: brief.id,
            title: `Received ${brief.upvotes.length} upvote${brief.upvotes.length !== 1 ? 's' : ''} on: ${brief.title}`,
            date: brief.createdAt,
            icon: <ThumbsUp className="w-4 h-4 text-green-600" />,
            link: `/briefs/${brief.id}`
          })),
          // Upvotes given by user
          ...filteredUserUpvotes.map((upvote: any) => ({
            type: 'given',
            id: upvote.id,
            title: `Upvoted: ${upvote.brief.title}`,
            date: upvote.createdAt,
            icon: <ThumbsUp className="w-4 h-4 text-blue-600" />,
            link: `/briefs/${upvote.brief.slug || upvote.brief.id}`
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return allUpvoteActivities.length > 0 ? allUpvoteActivities.map((activity) => (
          <ActivityItem
            key={`${activity.type}-${activity.id}`}
            icon={activity.icon}
            title={activity.title}
            date={activity.date}
            link={activity.link}
          />
        )) : (
          <div className="text-center text-gray-500 py-8">
            No upvote activity yet
          </div>
        );
      
      case 'all':
      default:
        // Combine all activities and sort by date
        const allActivities = [
          ...filteredBriefs.map(brief => ({
            type: 'brief',
            id: brief.id,
            title: `Created a new brief: ${brief.title}`,
            date: brief.createdAt,
            icon: <Book className="w-4 h-4 text-blue-600" />,
            link: `/briefs/${brief.id}`
          })),
          ...filteredSaved.map(brief => ({
            type: 'saved',
            id: brief.id,
            title: `Saved brief: ${brief.title}`,
            date: brief.createdAt,
            icon: <Bookmark className="w-4 h-4 text-red-600" />,
            link: `/briefs/${brief.id}`
          })),
          ...filteredReviews.map(review => ({
            type: 'review',
            id: review.id,
            title: `Reviewed: ${review.brief.title}`,
            date: review.createdAt,
            icon: <MessageSquare className="w-4 h-4 text-purple-600" />,
            link: `/briefs/${review.brief.id}`
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return allActivities.map((activity) => (
          <ActivityItem
            key={`${activity.type}-${activity.id}`}
            icon={activity.icon}
            title={activity.title}
            date={activity.date}
            link={activity.link}
          />
        ));
    }
  };

  /**
   * ACTIVITY ITEM COMPONENT
   * Renders individual activity items in the feed
   */
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
          <a href={link} className="text-sm hover:text-blue-600 transition-colors">
            {title}
          </a>
        ) : (
          <p className="text-sm">{title}</p>
        )}
        <p className="text-xs text-gray-500">
          {new Date(date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  /**
   * PLACEHOLDER AVATAR COMPONENT
   * Provides a consistent placeholder for users without profile images
   */
  const PlaceholderAvatar = ({ size = 96 }: { size?: number }) => (
    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 flex-shrink-0">
      <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#E5E7EB"/>
        <circle cx="75" cy="60" r="25" fill="#9CA3AF"/>
        <path d="M75 95C95 95 115 105 115 125V150H35V125C35 105 55 95 75 95Z" fill="#9CA3AF"/>
      </svg>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
      />
      {/* PROFILE HEADER SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {/* User Avatar with Placeholder Support */}
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-blue-100"
              />
            ) : (
              <PlaceholderAvatar size={96} />
            )}
            
            {/* User Information */}
            <div className="ml-6">
              <h1 className="text-3xl font-bold">{session?.user?.name || 'Demo User'}</h1>
              <p className="text-gray-600">{session?.user?.email || 'demo@deepscholar.local'}</p>
              <div className="flex items-center mt-2">
                <Award className="text-yellow-500 w-5 h-5 mr-2" />
                <span className="text-sm text-gray-600">Top Contributor</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Icons */}
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

        {/* STATS GRID - Overview of user activity */}
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

      {/* RECENT BRIEFS SECTION */}
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
            briefs.slice(0, 5).map((brief) => (
              <motion.div
                key={brief.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b pb-6 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/briefs/${brief.slug || brief.id}`}>
                      <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                        {brief.title}
                      </h3>
                    </Link>
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

      {/* ACTIVITY FEED SECTION */}
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

        {/* ACTIVITY TABS */}
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

        {/* ACTIVITY CONTENT */}
        <div className="space-y-4">
          {getActivityContent()}
        </div>
      </div>
    </div>
  );
}

/**
 * REMAINING TO-DOS AND FUTURE DEVELOPMENT PLAN
 * 
 * This profile page provides a solid foundation for user profile management, but there are several
 * areas for future enhancement:
 * 
 * 1. USER REVIEWS SYSTEM
 *    - Create a new server action to fetch reviews written by the current user
 *    - Add review management capabilities (edit/delete own reviews)
 *    - Display review statistics and average ratings given by the user
 * 
 * 2. UPVOTE TRACKING
 *    - Implement comprehensive upvote activity tracking
 *    - Show which briefs the user has upvoted and when
 *    - Add ability to manage upvotes from the profile page
 * 
 * 3. TOKEN SYSTEM
 *    - Integrate with a proper token/credit system for the platform
 *    - Show token earning and spending history
 *    - Add token balance management and transaction history
 * 
 * 4. ADVANCED FILTERING
 *    - Add more sophisticated time filtering options
 *    - Implement category-based filtering for activities
 *    - Add search functionality within user's own content
 * 
 * 5. PROFILE CUSTOMIZATION
 *    - Allow users to upload custom profile pictures
 *    - Add bio/description fields
 *    - Implement profile privacy settings
 * 
 * 6. SOCIAL FEATURES
 *    - Add following/followers functionality
 *    - Implement user-to-user messaging
 *    - Create collaboration features for brief creation
 * 
 * 7. ANALYTICS AND INSIGHTS
 *    - Provide detailed analytics on brief performance
 *    - Show trending topics the user is interested in
 *    - Add recommendations for new briefs to read or create
 * 
 * 8. EXPORT AND SHARING
 *    - Allow users to export their briefs and data
 *    - Add social sharing capabilities for achievements
 *    - Implement portfolio generation for academic/professional use
 */
