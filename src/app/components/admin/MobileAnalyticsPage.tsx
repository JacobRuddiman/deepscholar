'use client';

import React, { useState } from 'react';
import { TrendingUp, Users, Coins, Star, RefreshCw, Calendar, ArrowUp, ArrowDown, Activity, Eye, MessageSquare } from 'lucide-react';

interface AnalyticsData {
  userEngagement: any;
  contentPerformance: any;
  tokenEconomics: any;
  reviewAnalytics: any;
  categoryTrends: any;
  metadata: {
    period: { value: number; unit: string };
    generatedAt: string;
    dataPoints: string[];
  };
}

interface MobileAnalyticsPageProps {
  data: AnalyticsData;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function MobileAnalyticsPage({ data, onRefresh, refreshing }: MobileAnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'tokens' | 'reviews'>('overview');

  // Calculate key metrics
  const totalUsers = data.userEngagement?.newUserRegistrations?.length || 0;
  const activeUsers = data.userEngagement?.dailyActiveUsers?.length || 0;
  const totalBriefs = data.contentPerformance?.totalBriefs || 0;
  const totalViews = data.contentPerformance?.totalViews || 0;
  const totalRevenue = data.tokenEconomics?.totalRevenue || 0;
  const totalTokens = data.tokenEconomics?.totalTokensPurchased || 0;
  const userReviews = data.reviewAnalytics?.comparison?.userReviewCount || 0;
  const aiReviews = data.reviewAnalytics?.comparison?.aiReviewCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6" />
            <h1 className="text-xl font-bold">Analytics Dashboard</h1>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-indigo-100 text-sm">Comprehensive insights and data visualization</p>
        <div className="mt-4 flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Last {data.metadata.period.value} {data.metadata.period.unit}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`p-3 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`p-3 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'users' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`p-3 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'content' 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`p-3 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'tokens' 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tokens
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`p-3 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'reviews' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>+12%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>

            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-green-600" />
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>+8%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalBriefs}</p>
              <p className="text-sm text-gray-600">Total Briefs</p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-8 h-8 text-yellow-600" />
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>+15%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-purple-600" />
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>+5%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{userReviews + aiReviews}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-gray-900">{activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Views</span>
                <span className="font-semibold text-gray-900">{totalViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tokens Purchased</span>
                <span className="font-semibold text-gray-900">{totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">User Reviews</span>
                <span className="font-semibold text-gray-900">{userReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Reviews</span>
                <span className="font-semibold text-gray-900">{aiReviews}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              User Engagement
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{totalUsers}</p>
                <p className="text-sm text-gray-600">New Users</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Views</span>
                <span className="font-semibold text-gray-900">
                  {data.userEngagement?.briefViews?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Retention</span>
                <span className="font-semibold text-gray-900">
                  {data.userEngagement?.retentionCohorts?.length > 0
                    ? `${(data.userEngagement.retentionCohorts.reduce((sum: number, c: any) => sum + c.retentionRate, 0) / data.userEngagement.retentionCohorts.length).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Content Performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{totalBriefs}</p>
                <p className="text-sm text-gray-600">Total Briefs</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Upvotes</span>
                <span className="font-semibold text-gray-900">
                  {(data.contentPerformance?.totalUpvotes || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Engagement</span>
                <span className="font-semibold text-gray-900">
                  {totalViews > 0 
                    ? `${((data.contentPerformance?.totalUpvotes / totalViews) * 100).toFixed(2)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Top Performing Briefs */}
            {data.contentPerformance?.topPerformingBriefs && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Top Performing Briefs</h4>
                <div className="space-y-2">
                  {data.contentPerformance.topPerformingBriefs.slice(0, 3).map((brief: any, index: number) => (
                    <div key={brief.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{brief.title}</p>
                        <p className="text-xs text-gray-500">
                          {brief.viewCount.toLocaleString()} views • {brief.upvoteCount} upvotes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-yellow-600" />
              Token Economics
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-3xl font-bold text-yellow-600">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{totalTokens.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Tokens Purchased</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tokens Used</span>
                <span className="font-semibold text-gray-900">
                  {(data.tokenEconomics?.totalTokensUsed || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">30-Day Projection</span>
                <span className="font-semibold text-gray-900">
                  ${(data.tokenEconomics?.revenueProjection?.next30Days || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Token Balance Distribution */}
            {data.tokenEconomics?.tokenBalanceDistribution && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Token Balance Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(data.tokenEconomics.tokenBalanceDistribution).map(([range, count]) => (
                    <div key={range} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{range}</span>
                      <span className="font-medium text-gray-900">{count as number} users</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              Review Analytics
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{userReviews}</p>
                <p className="text-sm text-gray-600">User Reviews</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{aiReviews}</p>
                <p className="text-sm text-gray-600">AI Reviews</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">User Avg Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">
                    {(data.reviewAnalytics?.comparison?.userAverageRating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Avg Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">
                    {(data.reviewAnalytics?.comparison?.aiAverageRating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating Difference</span>
                <span className={`font-semibold ${
                  (data.reviewAnalytics?.comparison?.ratingDifference || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(data.reviewAnalytics?.comparison?.ratingDifference || 0) > 0 ? '+' : ''}
                  {(data.reviewAnalytics?.comparison?.ratingDifference || 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Rating Distribution */}
            {data.reviewAnalytics?.userRatingDistribution && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">User Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = data.reviewAnalytics.userRatingDistribution[5 - rating] || 0;
                    const maxCount = Math.max(...data.reviewAnalytics.userRatingDistribution);
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 w-12">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
