'use client';

import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, MessageSquare, User, Calendar, Star, ThumbsUp, Flag, MoreVertical } from 'lucide-react';

interface Review {
  id: string;
  content: string;
  rating: number;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  brief: {
    id: string;
    title: string;
  };
  helpful: boolean;
  upvoteCount: number;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MobileReviewsPageProps {
  reviews: Review[];
  onViewReview: (reviewId: string) => void;
  onEditReview: (review: Review) => void;
  onDeleteReview: (reviewId: string) => void;
  onToggleHelpful: (reviewId: string) => void;
  onToggleFlag: (reviewId: string) => void;
}

export default function MobileReviewsPage({ 
  reviews, 
  onViewReview, 
  onEditReview, 
  onDeleteReview, 
  onToggleHelpful,
  onToggleFlag
}: MobileReviewsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.author.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.brief.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'helpful' && review.helpful) ||
                         (filterBy === 'flagged' && review.flagged) ||
                         (filterBy === 'high-rated' && review.rating >= 4) ||
                         (filterBy === 'low-rated' && review.rating <= 2);
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedReviews.size} selected reviews?`)) {
      selectedReviews.forEach(reviewId => onDeleteReview(reviewId));
      setSelectedReviews(new Set());
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const helpfulReviews = reviews.filter(r => r.helpful).length;
  const flaggedReviews = reviews.filter(r => r.flagged).length;
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-xl font-bold">Reviews Management</h1>
        </div>
        <p className="text-pink-100 text-sm">Monitor and moderate user reviews</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{filteredReviews.length} reviews</span>
          </div>
          {selectedReviews.size > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span>{selectedReviews.size} selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
          <p className="text-sm text-gray-600">Total Reviews</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{helpfulReviews}</p>
          <p className="text-sm text-gray-600">Helpful</p>
        </div>

        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-gray-600">Avg Rating</p>
        </div>

        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <Flag className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{flaggedReviews}</p>
          <p className="text-sm text-gray-600">Flagged</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="helpful">Helpful Only</option>
              <option value="flagged">Flagged Only</option>
              <option value="high-rated">High Rated (4-5 stars)</option>
              <option value="low-rated">Low Rated (1-2 stars)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedReviews.size > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.map((review) => {
          const isSelected = selectedReviews.has(review.id);
          return (
            <div
              key={review.id}
              className={`bg-white rounded-2xl p-4 border transition-all ${
                isSelected 
                  ? 'border-pink-300 bg-pink-50 shadow-md' 
                  : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start space-x-3 mb-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectReview(review.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {review.author.name ?? 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRatingStars(review.rating)}
                      <span className="text-xs text-gray-500">({review.rating})</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                    {review.content}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Review for: <span className="font-medium">{review.brief.title}</span>
                  </div>
                </div>

                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Review Stats */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{review.upvoteCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {review.helpful && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Helpful
                    </span>
                  )}
                  {review.flagged && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Flagged
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewReview(review.id)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View</span>
                </button>
                <button
                  onClick={() => onToggleHelpful(review.id)}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    review.helpful
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {review.helpful ? 'Helpful' : 'Mark Helpful'}
                  </span>
                </button>
                <button
                  onClick={() => onToggleFlag(review.id)}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    review.flagged
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {review.flagged ? 'Flagged' : 'Flag'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
