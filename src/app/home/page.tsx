'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Clock, Filter } from 'lucide-react';
import PopularBriefs from '../components/popular_briefs';
import TopBriefsByCategory from '../components/top_briefs_by_category';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real app, this would navigate to search results
      console.log('Searching for:', searchQuery);
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
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
          
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-4 rounded-lg text-gray-900 bg-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
                placeholder="Search for research topics, questions, or specific insights..."
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 px-6 py-2 mr-1 my-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Search
              </button>
            </div>
            
            <div className="flex justify-center mt-4 space-x-6">
              <button type="button" className="flex items-center text-blue-100 hover:text-white">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Trending</span>
              </button>
              <button type="button" className="flex items-center text-blue-100 hover:text-white">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Recent</span>
              </button>
              <button type="button" className="flex items-center text-blue-100 hover:text-white">
                <Filter className="h-4 w-4 mr-1" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </form>
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
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-sm">Research Insights</p>
            <p className="text-3xl font-bold text-gray-900">12,483</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-sm">Models</p>
            <p className="text-3xl font-bold text-gray-900">7</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-sm">Users</p>
            <p className="text-3xl font-bold text-gray-900">3,721</p>
          </div>
        </div>
        
        {/* Popular Briefs Section */}
        <PopularBriefs />
        
        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>
        
        {/* Top Briefs By Category Section */}
        <TopBriefsByCategory />
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-gray-900">DeepScholar</h3>
              <p className="text-gray-600 text-sm">Collaborative AI research repository</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="/about" className="text-gray-600 hover:text-blue-600">About</a>
              <a href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy</a>
              <a href="/terms" className="text-gray-600 hover:text-blue-600">Terms</a>
              <a href="/contact" className="text-gray-600 hover:text-blue-600">Contact</a>
            </div>
          </div>
          
          <div className="mt-4 text-center text-gray-500 text-sm">
            © 2025 DeepScholar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}