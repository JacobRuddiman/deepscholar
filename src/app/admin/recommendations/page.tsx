'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Hash,
  Link,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X,
  Settings,
  Clock,
  Activity,
  Target
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { 
  getAdminRecommendations, 
  refreshUserRecommendations, 
  updateUserRecommendation,
  getRecommendationProgress 
} from '@/server/actions/admin';
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

interface DataViewSettings {
  categories: 'created' | 'interacted' | 'combined';
  titleWords: 'created' | 'interacted' | 'combined';
}

interface RecalcProgress {
  [userId: string]: number; // 0-100
}

// Mini selector component for data views
function DataViewSelector({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border-0 bg-transparent text-gray-600 cursor-pointer hover:text-gray-900 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Progress bar component
function ProgressBar({ progress, className = "" }: { progress: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
// Inline edit component
function InlineEdit({ 
  value, 
  onSave, 
  type = 'text' 
}: { 
  value: string | number | null; 
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  
  const handleSave = () => {
    onSave(type === 'number' ? Number(editValue) : editValue);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded inline-flex items-center gap-1"
        onClick={() => setIsEditing(true)}
      >
        <span>{value || 'N/A'}</span>
        <Edit className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-20 px-1 py-0.5 border rounded text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setIsEditing(false);
        }}
      />
      <button onClick={handleSave} className="text-green-600 hover:text-green-700">
        <Save className="w-3 h-3" />
      </button>
      <button onClick={() => setIsEditing(false)} className="text-red-600 hover:text-red-700">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Expanded details component
function ExpandedRowContent({ recommendation, onUpdateField }: { 
  recommendation: UserRecommendation;
  onUpdateField: (field: string, value: any) => void;
}) {
  return (
    <div className="bg-gray-50 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Categories Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <Hash className="w-4 h-4 mr-2 text-gray-500" />
              Category Preferences
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Top Combined</p>
                <div className="space-y-1">
                  {recommendation.topCombinedCategories.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700">{cat.category}</span>
                      <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
              Title Keywords
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Most Common Words</p>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.topCombinedTitleWords.slice(0, 12).map((word, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                    >
                      {word.word}
                      <span className="ml-1 text-gray-500">({word.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interaction Stats */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
              Interaction Statistics
            </h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Briefs Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalBriefsCreated}
                    type="number"
                    onSave={(v) => onUpdateField('totalBriefsCreated', v)}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reviews</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalReviews}
                    type="number"
                    onSave={(v) => onUpdateField('totalReviews', v)}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Upvotes Given</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalUpvotes}
                    type="number"
                    onSave={(v) => onUpdateField('totalUpvotes', v)}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Saves</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalSaves}
                    type="number"
                    onSave={(v) => onUpdateField('totalSaves', v)}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Views</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalViews}
                    type="number"
                    onSave={(v) => onUpdateField('totalViews', v)}
                  />
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reviews Received</p>
                <p className="text-lg font-semibold text-gray-900">
                  <InlineEdit
                    value={recommendation.totalReviewsReceived}
                    type="number"
                    onSave={(v) => onUpdateField('totalReviewsReceived', v)}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              Top Interacted Users
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {recommendation.topInteractedUsers.length > 0 ? (
                recommendation.topInteractedUsers.slice(0, 5).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 truncate">{user.name}</span>
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded">
                      {user.interactionCount} interactions
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No interactions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Citation Sources */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <Link className="w-4 h-4 mr-2 text-gray-500" />
              Top Citation Sources
            </h4>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {recommendation.topCitationDomains.length > 0 ? (
                recommendation.topCitationDomains.slice(0, 5).map((domain, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 truncate">{domain.domain}</span>
                    <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                      {domain.count} citations
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No citations yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Scores & Metrics */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
              Performance Metrics
            </h4>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Engagement Score</span>
                <span className="text-sm font-medium text-gray-900">
                  {recommendation.engagementScore?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${recommendation.engagementScore || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Content Quality</span>
                <span className="text-sm font-medium text-gray-900">
                  {recommendation.contentQualityScore?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${recommendation.contentQualityScore || 0}%` }}
                />
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg Read Time</span>
                <span className="text-xs font-medium text-gray-700">
                  {recommendation.avgBriefReadTime ? `${Math.round(recommendation.avgBriefReadTime)}s` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg Session</span>
                <span className="text-xs font-medium text-gray-700">
                  {recommendation.avgSessionDuration ? `${Math.round(recommendation.avgSessionDuration)}m` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Active Time</span>
                <span className="text-xs font-medium text-gray-700">
                  {recommendation.preferredTimeOfDay || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recalcProgress, setRecalcProgress] = useState<RecalcProgress>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dataViewSettings, setDataViewSettings] = useState<DataViewSettings>({
    categories: 'combined',
    titleWords: 'combined'
  });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [calculatingScores, setCalculatingScores] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const result = await getAdminRecommendations();

        if (result.success && result.data) {
          setRecommendations(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch recommendations');
        }
      } catch (err) {
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    void fetchRecommendations();
  }, []);

  // Progress tracking
  const trackProgress = useCallback(async (userIds: string[]) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Initialize progress for all users
    const initialProgress: RecalcProgress = {};
    userIds.forEach(id => {
      initialProgress[id] = 0;
    });
    setRecalcProgress(initialProgress);

    progressInterval.current = setInterval(async () => {
      try {
        const result = await getRecommendationProgress(userIds);
        if (result.success && result.data) {
          setRecalcProgress(result.data);
          
          // Check if all are complete
          const allComplete = Object.values(result.data).every(p => p >= 100);
          if (allComplete) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
              progressInterval.current = null;
            }
            
            // Refresh data after completion
            setTimeout(async () => {
              const fetchResult = await getAdminRecommendations();
              if (fetchResult.success && fetchResult.data) {
                setRecommendations(fetchResult.data);
              }
              setRecalcProgress({});
            }, 500);
          }
        }
      } catch (err) {
        console.error('Error tracking progress:', err);
      }
    }, 200); // Update every 200ms for smoother progress
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Filter and sort
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

  const handleRefreshAll = async () => {
    setRefreshing(true);
    const userIds = recommendations.map(r => r.userId);
    
    // Start tracking progress
    trackProgress(userIds);
    
    try {
      await refreshUserRecommendations();
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setRecalcProgress({});
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshUser = async (userId: string) => {
    trackProgress([userId]);
    
    try {
      await refreshUserRecommendations(userId);
    } catch (err) {
      console.error('Failed to refresh user recommendations:', err);
      setRecalcProgress({});
    }
  };

  const handleUpdateField = async (recId: string, field: string, value: any) => {
    try {
      const result = await updateUserRecommendation(recId, { [field]: value });
      if (result.success) {
        setRecommendations(prev => 
          prev.map(r => r.id === recId ? { ...r, [field]: value } : r)
        );
      }
    } catch (err) {
      console.error('Failed to update field:', err);
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryData = (rec: UserRecommendation) => {
    switch (dataViewSettings.categories) {
      case 'created': return rec.topCreatedCategories || [];
      case 'interacted': return rec.topInteractedCategories || [];
      default: return rec.topCombinedCategories || [];
    }
  };

  const getTitleWordData = (rec: UserRecommendation) => {
    switch (dataViewSettings.titleWords) {
      case 'created': return rec.topCreatedTitleWords || [];
      case 'interacted': return rec.topInteractedTitleWords || [];
      default: return rec.topCombinedTitleWords || [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Recommendations</h1>
          <p className="text-gray-600 mt-2">Analyze user behavior and preferences</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Recommendations</h1>
          <p className="text-gray-600 mt-2">Analyze user behavior and preferences</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Recommendations</h1>
        <p className="text-gray-600 mt-2">Analyze user behavior and preferences</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'engagement', label: 'Sort by Engagement' },
              { value: 'quality', label: 'Sort by Content Quality' },
              { value: 'briefs', label: 'Sort by Briefs Created' },
              { value: 'interactions', label: 'Sort by Total Interactions' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'active', label: 'Active Users (>50 engagement)' },
              { value: 'inactive', label: 'Inactive Users' },
            ]}
          />
          
          <Button
            onClick={handleRefreshAll}
            disabled={refreshing || Object.keys(recalcProgress).length > 0}
            className="flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead className="min-w-[150px]">
                <div className="flex flex-col">
                  <span>Categories</span>
                  <DataViewSelector
                    value={dataViewSettings.categories}
                    onChange={(v) => setDataViewSettings(prev => ({ ...prev, categories: v as any }))}
                    options={[
                      { value: 'combined', label: 'Combined' },
                      { value: 'created', label: 'Created' },
                      { value: 'interacted', label: 'Interacted' }
                    ]}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[150px]">
                <div className="flex flex-col">
                  <span>Keywords</span>
                  <DataViewSelector
                    value={dataViewSettings.titleWords}
                    onChange={(v) => setDataViewSettings(prev => ({ ...prev, titleWords: v as any }))}
                    options={[
                      { value: 'combined', label: 'Combined' },
                      { value: 'created', label: 'Created' },
                      { value: 'interacted', label: 'Interacted' }
                    ]}
                  />
                </div>
              </TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Briefs</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Interactions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecommendations.map((rec) => {
              const isExpanded = expandedRows.has(rec.id);
              const isRecalculating = recalcProgress[rec.userId] !== undefined;
              const progress = recalcProgress[rec.userId] || 0;
              const totalInteractions = rec.totalReviews + rec.totalUpvotes + rec.totalSaves;

              return (
                <React.Fragment key={rec.id}>
                  <TableRow className={isExpanded ? 'bg-gray-50' : ''}>
                    <TableCell>
                        <button
                        onClick={() => toggleRowExpansion(rec.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                        </button>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {rec.user.image ? (
                                <img src={rec.user.image} alt={rec.user.name ?? 'User'} className="w-8 h-8 rounded-full" />
                            ) : (
                                <span className="text-sm font-medium text-gray-600">
                                {(rec.user.name ?? 'U').charAt(0).toUpperCase()}
                                </span>
                            )}
                            </div>
                            <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{rec.user.name ?? 'Anonymous'}</p>
                            <p className="text-sm text-gray-500 truncate">{rec.user.email}</p>
                            </div>
                        </div>
                        {isRecalculating && (
                            <ProgressBar progress={progress} className="mt-2" />
                        )}
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getCategoryData(rec).slice(0, 3).map((cat, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {cat.category} ({cat.count})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getTitleWordData(rec).slice(0, 3).map((word, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {word.word}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${rec.engagementScore || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {rec.engagementScore?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full"
                            style={{ width: `${rec.contentQualityScore || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {rec.contentQualityScore?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{rec.totalBriefsCreated}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{rec.totalReviews}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{totalInteractions}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefreshUser(rec.userId)}
                          disabled={isRecalculating}
                          title="Recalculate recommendations"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(rec.userId);
                            setShowScoreModal(true);
                          }}
                          disabled={calculatingScores === rec.userId}
                          title="View recommendation scores for all briefs"
                        >
                          <Target className={`w-4 h-4 ${calculatingScores === rec.userId ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                        <TableCell colSpan={10} className="p-0">
                        <ExpandedRowContent 
                            recommendation={rec} 
                            onUpdateField={(field, value) => handleUpdateField(rec.id, field, value)}
                        />
                        </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
