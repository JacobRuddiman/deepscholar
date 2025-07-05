import React, { useState, useEffect } from 'react';
import { X, BarChart3, Info, Search, Filter, ArrowUpDown, Target, Clock, Star, Eye } from 'lucide-react';

interface RecommendationScore {
  briefId: string;
  score: number;
  reasons: string[];
  brief: {
    id: string;
    title: string;
    abstract: string | null;
    createdAt: Date;
    viewCount: number | null;
    categories: Array<{
      name: string;
    }>;
    reviews: Array<{
      rating: number;
    }>;
  };
}

interface RecommendationScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function RecommendationScoreModal({ 
  isOpen, 
  onClose, 
  userId 
}: RecommendationScoreModalProps) {
  const [scores, setScores] = useState<RecommendationScore[]>([]);
  const [filteredScores, setFilteredScores] = useState<RecommendationScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'title' | 'date' | 'views'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch scores when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchScores();
    }
  }, [isOpen, userId]);

  // Filter and sort scores
  useEffect(() => {
    let filtered = scores.filter(score => {
      const matchesSearch = score.brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (score.brief.abstract || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchesSearch;
      
      return matchesSearch && score.brief.categories.some(cat => cat.name === categoryFilter);
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'title':
          comparison = a.brief.title.localeCompare(b.brief.title);
          break;
        case 'date':
          comparison = new Date(a.brief.createdAt).getTime() - new Date(b.brief.createdAt).getTime();
          break;
        case 'views':
          comparison = (a.brief.viewCount || 0) - (b.brief.viewCount || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredScores(filtered);
  }, [scores, searchTerm, sortBy, sortOrder, categoryFilter]);

  const fetchScores = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/recommendation-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScores(result.data);
      } else {
        setError(result.error || 'Failed to fetch scores');
      }
    } catch (err) {
      setError('Failed to fetch recommendation scores');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    scores.forEach(score => {
      score.brief.categories.forEach(cat => categories.add(cat.name));
    });
    return Array.from(categories).sort();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const averageScore = scores.length > 0 
    ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-2 text-pink-500" />
              Recommendation Scores for All Briefs
            </h2>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">
                {averageScore.toFixed(1)}% avg
              </span>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search briefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="score">Sort by Score</option>
              <option value="title">Sort by Title</option>
              <option value="date">Sort by Date</option>
              <option value="views">Sort by Views</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === 'desc' ? 'Desc' : 'Asc'}
            </button>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Calculating scores...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredScores.length} of {scores.length} briefs
              </div>
              
              <div className="space-y-4">
                {filteredScores.map((scoreData) => {
                  const avgRating = scoreData.brief.reviews.length > 0
                    ? scoreData.brief.reviews.reduce((sum, r) => sum + r.rating, 0) / scoreData.brief.reviews.length
                    : null;
                  
                  return (
                    <div key={scoreData.briefId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {scoreData.brief.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {scoreData.brief.abstract || 'No abstract available'}
                          </p>
                        </div>
                        <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(scoreData.score)}`}>
                          {Math.round(scoreData.score)}%
                        </div>
                      </div>
                      
                      {/* Brief metadata */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(scoreData.brief.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {scoreData.brief.viewCount || 0} views
                        </div>
                        {avgRating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {avgRating.toFixed(1)} ({scoreData.brief.reviews.length})
                          </div>
                        )}
                      </div>
                      
                      {/* Categories */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {scoreData.brief.categories.map((category, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {category.name}
                          </span>
                        ))}
                      </div>
                      
                      {/* Reasons */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Recommendation Reasons:
                        </h4>
                        {scoreData.reasons.length > 0 ? (
                          <div className="space-y-1">
                            {scoreData.reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{reason}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No specific reasons available</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            Scores are calculated based on user preferences, content quality, popularity, and recency.
          </p>
        </div>
      </div>
    </div>
  );
}
