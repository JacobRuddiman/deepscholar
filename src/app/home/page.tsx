'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Filter, BookOpen, Users, Brain, ArrowRight } from 'lucide-react';
import PopularBriefs from '../components/popular_briefs';
import TopBriefsByCategory from '../components/top_briefs_by_category';
import SearchBar from '../components/SearchBar';
import { getBriefStats, getRecentBriefs } from '@/server/actions/home';
import BriefCard from '../components/brief_card';
import type { BriefCardProps } from '../components/brief_card';
import TooltipWrapper from '../components/TooltipWrapper';


// Transform database brief to BriefCardProps
const transformBrief = (brief: any): BriefCardProps => {
  const reviewCount = brief.reviews?.length ?? 0;
  const averageRating = reviewCount > 0 
    ? brief.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewCount 
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
    slug: brief.slug,
  };
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ briefCount: 0, modelCount: 0, userCount: 0 });
  const [recentBriefs, setRecentBriefs] = useState<BriefCardProps[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

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
        const result = await getRecentBriefs(3);
        if (result.success && result.data) {
          setRecentBriefs(result.data.map(transformBrief));
        }
      } catch (error) {
        console.error('Failed to fetch recent briefs:', error);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchStats();
    fetchRecent();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/briefs?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleFilterClick = (type: 'trending' | 'recent') => {
    if (type === 'trending') {
      window.location.href = '/briefs?sort=popular';
    } else {
      window.location.href = '/briefs?sort=recent';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-3">DeepScholar</h1>
          <p className="text-center text-blue-100 text-lg max-w-3xl mx-auto mb-8">
            Discover, search, and share AI-generated research insights from leading models
          </p>
          
          <div className="max-w-4xl mx-auto">
            <SearchBar 
              placeholder="Search for research topics, questions, or specific insights..."
              showFilters={true}
              size="lg"
              className="mb-4"
            />
            
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
                <a 
                  href="/briefs" 
                  className="flex items-center text-blue-100 hover:text-white transition-colors"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="text-sm">Browse All</span>
                </a>
              </TooltipWrapper>
            </div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <svg className="absolute bottom-0 w-full h-16" preserveAspectRatio="none" viewBox="0 0 1440 54">
            <path
              fill="#f9fafb"
              fillOpacity="1"
              d="M0,32L80,26.7C160,21,320,11,480,16C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,54L1360,54C1280,54,1120,54,960,54C800,54,640,54,480,54C320,54,160,54,80,54L0,54Z"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm">Research Insights</p>
            {loadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{stats.briefCount.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <Brain className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-500 text-sm">AI Models</p>
            {loadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{stats.modelCount}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-gray-500 text-sm">Contributors</p>
            {loadingStats ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{stats.userCount.toLocaleString()}</p>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TooltipWrapper 
              content="Upload and share your AI-generated research insights with the community"
              position="top"
            >
              <a 
                href="/brief_upload" 
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Create Research Brief</h3>
                  <p className="text-sm text-blue-700">Share your AI-generated insights</p>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </a>
            </TooltipWrapper>
            <TooltipWrapper 
              content="Explore the complete library of research briefs with search and filtering"
              position="top"
            >
              <a 
                href="/briefs" 
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Browse Research</h3>
                  <p className="text-sm text-green-700">Explore all available insights</p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </a>
            </TooltipWrapper>
            <TooltipWrapper 
              content="View and manage all the research briefs you've contributed to the platform"
              position="top"
            >
              <a 
                href="/my-briefs" 
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900">My Contributions</h3>
                  <p className="text-sm text-purple-700">View your research briefs</p>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </a>
            </TooltipWrapper>
          </div>
        </div>
        
        {/* Popular Briefs Section */}
        <PopularBriefs />
        
        {/* Recent Briefs Section */}
        {recentBriefs.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-8"></div>
            <section className="py-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Latest Research</h2>
                <TooltipWrapper 
                  content="View all recent research briefs with sorting and filtering options"
                  position="left"
                >
                  <a href="/briefs?sort=recent" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View all
                  </a>
                </TooltipWrapper>
              </div>
              
              {loadingRecent ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentBriefs.map((brief) => (
                    <BriefCard key={brief.id} {...brief} compact />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        
        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>
        
        {/* Top Briefs By Category Section */}
        <TopBriefsByCategory />
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-gray-900">DeepScholar</h3>
              <p className="text-gray-600 text-sm">Collaborative AI research repository</p>
            </div>
            
            <div className="flex space-x-6">
              <TooltipWrapper content="Learn more about DeepScholar and our mission" position="top">
                <a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              </TooltipWrapper>
              <TooltipWrapper content="Read our privacy policy and data handling practices" position="top">
                <a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy</a>
              </TooltipWrapper>
              <TooltipWrapper content="View our terms of service and usage guidelines" position="top">
                <a href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">Terms</a>
              </TooltipWrapper>
              <TooltipWrapper content="Get in touch with our support team" position="top">
                <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
              </TooltipWrapper>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-500 text-sm">
            © 2025 DeepScholar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
