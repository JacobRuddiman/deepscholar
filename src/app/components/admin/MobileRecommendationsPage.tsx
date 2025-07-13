// components/admin/MobileRecommendationsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Hash,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  User,
  Activity,
  Clock
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import RecommendationScoreModal from '@/app/components/recommendation_score_modal';

interface UserRecommendation {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  topCreatedCategories: Array<{ category: string; count: number }>;
  topInteractedCategories: Array<{ category: string; count: number }>;
  topCombinedCategories: Array<{ category: string; count: number }>;
  topCreatedTitleWords: Array<{ word: string; count: number }>;
  topInteractedTitleWords: Array<{ word: string; count: number }>;
  topCombinedTitleWords: Array<{ word: string; count: number }>;
  totalBriefsCreated: number;
  totalReviews: number;
  totalUpvotes: number;
  totalSaves: number;
  totalViews: number;
  totalReviewsReceived: number;
  totalUpvotesReceived: number;
  searchKeywords: Array<{ keyword: string; count: number }>;
  topInteractedUsers: Array<{ userId: string; name: string; interactionCount: number }>;
  topCitationDomains: Array<{ domain: string; count: number }>;
  engagementScore: number | null;
  contentQualityScore: number | null;
  avgBriefReadTime: number | null;
  avgSessionDuration: number | null;
  preferredTimeOfDay: string | null;
  lastCalculated: string;
}

interface MobileRecommendationsPageProps {
  recommendations: UserRecommendation[];
  onRefreshUser: (userId: string) => void;
  onRefreshAll: () => void;
  recalcProgress: { [userId: string]: number };
  refreshing: boolean;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[35px]">
        {Math.round(progress)}%
      </span>
    </div>
  );
}

function RecommendationCard({ 
  recommendation, 
  onRefreshUser, 
  onViewScores, 
  recalcProgress, 
  calculatingScores 
}: {
  recommendation: UserRecommendation;
  onRefreshUser: (userId: string) => void;
  onViewScores: (userId: string) => void;
  recalcProgress: { [userId: string]: number };
  calculatingScores: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRecalculating = recalcProgress[recommendation.userId] !== undefined;
  const progress = recalcProgress[recommendation.userId] || 0;
  const totalInteractions = recommendation.totalReviews + recommendation.totalUpvotes + recommendation.totalSaves;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              {recommendation.user.image ? (
                <img 
                  src={recommendation.user.image} 
                  alt={recommendation.user.name ?? 'User'} 
                  className="w-12 h-12 rounded-xl object-cover" 
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {(recommendation.user.name ?? 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {recommendation.user.name ?? 'Anonymous'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {recommendation.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isRecalculating && (
          <ProgressBar progress={progress} />
        )}
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Engagement Score */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">
                {recommendation.engagementScore?.toFixed(0) || 0}%
              </span>
            </div>
            <p className="text-xs text-blue-700 font-medium">Engagement</p>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${recommendation.engagementScore || 0}%` }}
              />
            </div>
          </div>

          {/* Content Quality */}
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-green-900">
                {recommendation.contentQualityScore?.toFixed(0) || 0}%
              </span>
            </div>
            <p className="text-xs text-green-700 font-medium">Quality</p>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${recommendation.contentQualityScore || 0}%` }}
              />
            </div>
          </div>

          {/* Briefs Created */}
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-bold text-purple-900">
                {recommendation.totalBriefsCreated}
              </span>
            </div>
            <p className="text-xs text-purple-700 font-medium">Briefs Created</p>
          </div>

          {/* Total Interactions */}
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-900">
                {totalInteractions}
              </span>
            </div>
            <p className="text-xs text-orange-700 font-medium">Interactions</p>
          </div>
        </div>
      </div>

      {/* Categories and Keywords */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 gap-3">
          {/* Top Categories */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center mb-2">
              <Hash className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Top Categories</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendation.topCombinedCategories.slice(0, 4).map((cat, idx) => (
                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                  {cat.category} ({cat.count})
                </span>
              ))}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center mb-2">
              <BookOpen className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Keywords</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendation.topCombinedTitleWords.slice(0, 6).map((word, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                  {word.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-4">
            
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Reviews Given</p>
                <p className="text-lg font-bold text-gray-900">{recommendation.totalReviews}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Upvotes Given</p>
                <p className="text-lg font-bold text-gray-900">{recommendation.totalUpvotes}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Saves</p>
                <p className="text-lg font-bold text-gray-900">{recommendation.totalSaves}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Views</p>
                <p className="text-lg font-bold text-gray-900">{recommendation.totalViews}</p>
              </div>
            </div>

            {/* Top Interacted Users */}
            {recommendation.topInteractedUsers.length > 0 && (
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center mb-3">
                  <Users className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Top Interactions</span>
                </div>
                <div className="space-y-2">
                  {recommendation.topInteractedUsers.slice(0, 3).map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{user.name}</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {user.interactionCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citation Domains */}
            {recommendation.topCitationDomains.length > 0 && (
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center mb-3">
                  <Hash className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">Citation Sources</span>
                </div>
                <div className="space-y-1">
                  {recommendation.topCitationDomains.slice(0, 3).map((domain, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">{domain.domain}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {domain.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center mb-3">
                <Clock className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-900">Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Avg Read Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {recommendation.avgBriefReadTime ? `${Math.round(recommendation.avgBriefReadTime)}s` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Session</p>
                  <p className="text-sm font-medium text-gray-900">
                    {recommendation.avgSessionDuration ? `${Math.round(recommendation.avgSessionDuration)}m` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {recommendation.preferredTimeOfDay || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(recommendation.lastCalculated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <Button
            onClick={() => onRefreshUser(recommendation.userId)}
            disabled={isRecalculating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate'}
          </Button>
          <Button
            onClick={() => onViewScores(recommendation.userId)}
            disabled={calculatingScores === recommendation.userId}
            variant="secondary"
            className="flex-1"
          >
            <Target className={`w-4 h-4 mr-2 ${calculatingScores === recommendation.userId ? 'animate-spin' : ''}`} />
            View Scores
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MobileRecommendationsPage({ 
  recommendations, 
  onRefreshUser, 
  onRefreshAll, 
  recalcProgress, 
  refreshing 
}: MobileRecommendationsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [filteredRecommendations, setFilteredRecommendations] = useState<UserRecommendation[]>([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [calculatingScores, setCalculatingScores] = useState<string | null>(null);

  // Filter and sort logic
  useEffect(() => {
    let filtered = recommendations.filter(rec => {
      const matchesSearch = 
        (rec.user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'active') {
        return matchesSearch && rec.engagementScore && rec.engagementScore > 50;
      } else if (filterBy === 'inactive') {
        return matchesSearch && (!rec.engagementScore || rec.engagementScore <= 50);
      }
      
      return matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.user.name ?? '').localeCompare(b.user.name ?? '');
        case 'engagement':
          return (b.engagementScore ?? 0) - (a.engagementScore ?? 0);
        case 'quality':
          return (b.contentQualityScore ?? 0) - (a.contentQualityScore ?? 0);
        case 'briefs':
          return b.totalBriefsCreated - a.totalBriefsCreated;
        case 'interactions':
          return (b.totalReviews + b.totalUpvotes + b.totalSaves) - 
                 (a.totalReviews + a.totalUpvotes + a.totalSaves);
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
  }, [recommendations, searchTerm, sortBy, filterBy]);

  const handleViewScores = (userId: string) => {
    setSelectedUserId(userId);
    setShowScoreModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">User Recommendations</h1>
        <p className="text-blue-100">Analyze user behavior and preferences</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'engagement', label: 'By Engagement' },
              { value: 'quality', label: 'By Quality' },
              { value: 'briefs', label: 'By Briefs' },
              { value: 'interactions', label: 'By Interactions' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'active', label: 'Active Users' },
              { value: 'inactive', label: 'Inactive Users' },
            ]}
          />
        </div>

        <Button
          onClick={onRefreshAll}
          disabled={refreshing || Object.keys(recalcProgress).length > 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating All...' : 'Recalculate All'}
        </Button>
      </div>

      {/* Results Count */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {filteredRecommendations.length} user{filteredRecommendations.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {recommendations.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onRefreshUser={onRefreshUser}
            onViewScores={handleViewScores}
            recalcProgress={recalcProgress}
            calculatingScores={calculatingScores}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRecommendations.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Recommendation Score Modal */}
      <RecommendationScoreModal
        isOpen={showScoreModal}
        onClose={() => {
          setShowScoreModal(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />
    </div>
  );
}