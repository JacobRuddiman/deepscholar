'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Filter, BookOpen, Users, Brain, ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import PopularBriefs from '../components/popular_briefs';
import TopBriefsByCategory from '../components/top_briefs_by_category';
import SearchBar from '../components/SearchBar';
import { getBriefStats, getRecentBriefs, BriefWithRelations } from '@/server/actions/home';
import BriefCard from '../components/brief_card';
import type { BriefCardProps } from '../components/brief_card';
import TooltipWrapper from '../components/TooltipWrapper';
import { useDeviceDetection } from '../hooks/useDeviceDetection';


// Define the database brief type based on your Prisma schema
interface DatabaseBrief {
  id: string;
  title: string;
  abstract: string | null;
  createdAt: Date;
  response: string;
  slug: string | null;
  viewCount: number | null;
  model: {
    name: string;
  } | null;
  categories: Array<{
    name: string;
  }>;
  reviews: Array<{
    rating: number;
  }>;
}

// Transform database brief to BriefCardProps
const transformBrief = (brief: BriefWithRelations): BriefCardProps => {
  const reviewCount = brief.reviews?.length ?? 0;
  const averageRating = reviewCount > 0 
    ? brief.reviews.reduce((sum: number, review) => sum + review.rating, 0) / reviewCount 
    : undefined;

  return {
    id: brief.id,
    title: brief.title,
    abstract: brief.abstract ?? '',
    model: brief.model?.name ?? 'Unknown',
    date: brief.createdAt.toISOString().split('T')[0],
    readTime: `${Math.max(1, Math.ceil((brief.response?.length ?? 0) / 1000))} min`,
    category: brief.categories?.[0]?.name ?? 'General',
    views: brief.viewCount ?? 0,
    rating: averageRating,
    reviewCount: reviewCount,
    featured: (brief.viewCount ?? 0) > 100,
    slug: brief.slug ?? undefined,
  };
};

export default function HomePage() {
  const [stats, setStats] = useState({ briefCount: 0, modelCount: 0, userCount: 0 });
  const [recentBriefs, setRecentBriefs] = useState<BriefCardProps[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { isMobile } = useDeviceDetection();

  useEffect(() => {
    // Fetch statistics
    const fetchStats = async () => {
      try {
        const result = await getBriefStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    // Fetch recent briefs
    const fetchRecent = async () => {
      try {
        const result = await getRecentBriefs(isMobile ? 2 : 3);
        if (result.success && result.data) {
          setRecentBriefs(result.data.map(transformBrief));
        }
      } catch (error) {
        console.error('Failed to fetch recent briefs:', error);
      } finally {
        setLoadingRecent(false);
      }
    };

    void fetchStats();
    void fetchRecent();
  }, [isMobile]);

  const handleFilterClick = (type: 'trending' | 'recent') => {
    if (type === 'trending') {
      window.location.href = '/briefs?sort=popular';
    } else {
      window.location.href = '/briefs?sort=recent';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 md:mb-3">DeepScholar</h1>
          <p className="text-center text-blue-100 text-base md:text-lg max-w-3xl mx-auto mb-6 md:mb-8 px-4">
            Discover, search, and share AI-generated research insights
          </p>
          
          <div className="max-w-4xl mx-auto">
            <SearchBar 
              placeholder={isMobile ? "Search research..." : "Search for research topics, questions, or specific insights..."}
              showFilters={!isMobile}
              size={isMobile ? "md" : "lg"}
              className="mb-4"
            />
            
            {/* Mobile Filter Buttons */}
            {isMobile ? (
              <div className="flex justify-center space-x-4 mt-4">
                <button 
                  onClick={() => handleFilterClick('trending')}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Trending
                </button>
                <button 
                  onClick={() => handleFilterClick('recent')}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Recent
                </button>
                <Link 
                  href="/briefs"
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Browse All
                </Link>
              </div>
            ) : (
              <div className="flex justify-center mt-4 space-x-6">
                <TooltipWrapper 
                  content="View the most popular research briefs based on views and engagement"
                  position="bottom"
                >
                  <button 
                    type="button" 
                    onClick={() => handleFilterClick('trending')}
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">Trending</span>
                  </button>
                </TooltipWrapper>
                <TooltipWrapper 
                  content="View the most recently published research briefs"
                  position="bottom"
                >
                  <button 
                    type="button" 
                    onClick={() => handleFilterClick('recent')}
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">Recent</span>
                  </button>
                </TooltipWrapper>
                <TooltipWrapper 
                  content="Browse all research briefs with advanced filtering options"
                  position="bottom"
                >
                  <Link 
                    href="/briefs" 
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    <span className="text-sm">Browse All</span>
                  </Link>
                </TooltipWrapper>
              </div>
            )}
          </div>
        </div>
        
        {/* Wave Separator - Hidden on mobile */}
        <div className="h-8 md:h-16 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-8 md:h-16 min-w-full" preserveAspectRatio="none" viewBox="0 0 1440 54">
            <path
              fill="#f9fafb"
              fillOpacity="1"
              d="M0,32L80,26.7C160,21,320,11,480,16C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,54L1360,54C1280,54,1120,54,960,54C800,54,640,54,480,54C320,54,160,54,80,54L0,54Z"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-full overflow-x-hidden">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white p-3 md:p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1 md:mb-2">
              <BookOpen className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
            </div>
            <p className="text-gray-500 text-xs md:text-sm">Research</p>
            {loadingStats ? (
              <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.briefCount.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-white p-3 md:p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1 md:mb-2">
              <Brain className="h-6 md:h-8 w-6 md:w-8 text-green-600" />
            </div>
            <p className="text-gray-500 text-xs md:text-sm">AI Models</p>
            {loadingStats ? (
              <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.modelCount}</p>
            )}
          </div>
          <div className="bg-white p-3 md:p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1 md:mb-2">
              <Users className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
            </div>
            <p className="text-gray-500 text-xs md:text-sm">Contributors</p>
            {loadingStats ? (
              <div className="h-6 md:h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.userCount.toLocaleString()}</p>
            )}
          </div>
        </div>
        
        {/* Quick Actions - Mobile Dropdown */}
        {isMobile ? (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="w-full p-4 flex items-center justify-between"
            >
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <ChevronDown className={`h-5 w-5 text-gray-600 transform transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
            </button>
            
            {showQuickActions && (
              <div className="px-4 pb-4 space-y-3">
                <Link 
                  href="/brief_upload" 
                  className="flex items-center p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 text-sm">Create Research Brief</h3>
                    <p className="text-xs text-blue-700">Share your AI insights</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </Link>
                <Link 
                  href="/briefs" 
                  className="flex items-center p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 text-sm">Browse Research</h3>
                    <p className="text-xs text-green-700">Explore all insights</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-green-600" />
                </Link>
                <Link 
                  href="/my-briefs" 
                  className="flex items-center p-3 bg-purple-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 text-sm">My Contributions</h3>
                    <p className="text-xs text-purple-700">View your briefs</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Quick Actions */
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TooltipWrapper 
                content="Upload and share your AI-generated research insights with the community"
                position="top"
              >
                <Link 
                  href="/brief_upload" 
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Create Research Brief</h3>
                    <p className="text-sm text-blue-700">Share your AI-generated insights</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </TooltipWrapper>
              <TooltipWrapper 
                content="Explore the complete library of research briefs with search and filtering"
                position="top"
              >
                <Link 
                  href="/briefs" 
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Browse Research</h3>
                    <p className="text-sm text-green-700">Explore all available insights</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </TooltipWrapper>
              <TooltipWrapper 
                content="View and manage all the research briefs you've contributed to the platform"
                position="top"
              >
                <Link 
                  href="/my-briefs" 
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900">My Contributions</h3>
                    <p className="text-sm text-purple-700">View your research briefs</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </TooltipWrapper>
            </div>
          </div>
        )}
        
        {/* Popular Briefs Section */}
        <PopularBriefs />
        
        {/* Recent Briefs Section */}
        {recentBriefs.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-6 md:my-8"></div>
            <section className="py-4 md:py-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Latest Research</h2>
                <TooltipWrapper 
                  content="View all recent research briefs with sorting and filtering options"
                  position="left"
                >
                  <Link href="/briefs?sort=recent" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View all
                  </Link>
                </TooltipWrapper>
              </div>
              
              {loadingRecent ? (
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
                  {[...Array(isMobile ? 2 : 3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}`}>
                  {recentBriefs.map((brief) => (
                    <BriefCard key={brief.id} {...brief} compact />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        
        {/* Divider */}
        <div className="border-t border-gray-200 my-6 md:my-8"></div>
        
        {/* Top Briefs By Category Section */}
        <TopBriefsByCategory />
      </div>
      
      {/* Footer - Responsive */}
      <footer className="bg-gray-100 mt-8 md:mt-12 py-6 md:py-8 overflow-x-hidden">
        <div className="container mx-auto px-4 max-w-full">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900">DeepScholar</h3>
              <p className="text-gray-600 text-sm">Collaborative AI research repository</p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:space-x-6">
              <a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">About</a>
              <a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Privacy</a>
              <a href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Terms</a>
              <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">Contact</a>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-500 text-xs md:text-sm">
            © 2025 DeepScholar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}