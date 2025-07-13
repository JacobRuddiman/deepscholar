// components/admin/MobileAIReviewsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bot, 
  Star, 
  TrendingUp, 
  Zap, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Calendar,
  ThumbsUp,
  Cpu,
  FileText,
  X,
  Save
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { useRouter } from 'next/navigation';

interface AIReview {
  id: string;
  content: string;
  rating: number;
  model: {
    id: string;
    name: string;
    provider: string;
  };
  brief: {
    id: string;
    title: string;
  };
  helpfulCount: number;
  createdAt: string;
}

interface MobileAIReviewsPageProps {
  aiReviews: AIReview[];
  onEditReview: (review: AIReview) => void;
  onDeleteReview: (reviewId: string) => void;
  onBulkDelete: () => void;
  selectedReviews: Set<string>;
  onSelectReview: (reviewId: string) => void;
  onSelectAll: () => void;
  selectAll: boolean;
  onSaveReview: (updatedReview: Partial<AIReview>) => void;
}

// Mobile Edit Modal Component
function MobileEditAIReviewModal({ 
  review, 
  isOpen, 
  onClose, 
  onSave 
}: {
  review: AIReview | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReview: Partial<AIReview>) => void;
}) {
  const [formData, setFormData] = useState({
    content: '',
    rating: 5,
    helpfulCount: 0
  });

  useEffect(() => {
    if (review) {
      setFormData({
        content: review.content,
        rating: review.rating,
        helpfulCount: review.helpfulCount
      });
    }
  }, [review]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit AI Review</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="space-y-4">
            
            {/* Review Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{review.model.name}</h4>
                  <p className="text-sm text-gray-500">{review.model.provider}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Brief: {review.brief.title}</p>
                <p>Created: {new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value={1}>⭐ 1 Star</option>
                <option value={2}>⭐⭐ 2 Stars</option>
                <option value={3}>⭐⭐⭐ 3 Stars</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              </select>
            </div>

            {/* Helpful Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Helpful Count
              </label>
              <input
                type="number"
                value={formData.helpfulCount}
                onChange={(e) => setFormData({ ...formData, helpfulCount: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="AI review content..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIReviewCard({ 
  review, 
  onEdit, 
  onDelete, 
  onViewBrief,
  isSelected,
  onSelect
}: {
  review: AIReview;
  onEdit: (review: AIReview) => void;
  onDelete: (reviewId: string) => void;
  onViewBrief: (briefId: string) => void;
  isSelected: boolean;
  onSelect: (reviewId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isSelected ? 'border-purple-200 bg-purple-50' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(review.id)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {review.model.name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {review.model.provider}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getRatingStars(review.rating)}
              </div>
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
      </div>

      {/* Content Preview */}
      <div className="px-4 pb-4">
        <p className="text-sm text-gray-700 line-clamp-3 mb-3">
          {review.content}
        </p>
        
        {/* Brief Info */}
        <button
          onClick={() => onViewBrief(review.brief.id)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-3"
        >
          <FileText className="w-4 h-4" />
          <span className="truncate">{review.brief.title}</span>
        </button>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{review.helpfulCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            review.helpfulCount > 5 ? 'bg-green-100 text-green-800' :
            review.helpfulCount > 0 ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {review.helpfulCount} helpful
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-4">
            {/* Full Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Full Review</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.content}
              </p>
            </div>

            {/* Review Details */}
            <div className="bg-white rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Review Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">AI Model:</span>
                  <p className="font-medium">{review.model.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <p className="font-medium">{review.model.provider}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rating:</span>
                  <p className="font-medium">{review.rating}/5 stars</p>
                </div>
                <div>
                  <span className="text-gray-500">Helpful Marks:</span>
                  <p className="font-medium">{review.helpfulCount}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium">
                    {new Date(review.createdAt).toLocaleDateString()} at {new Date(review.createdAt).toLocaleTimeString()}
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
            onClick={() => onViewBrief(review.brief.id)}
            variant="secondary"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Brief
          </Button>
          <Button
            onClick={() => onEdit(review)}
            variant="secondary"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(review.id)}
            variant="danger"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MobileAIReviewsPage({ 
  aiReviews, 
  onEditReview, 
  onDeleteReview, 
  onBulkDelete,
  selectedReviews,
  onSelectReview,
  onSelectAll,
  selectAll,
  onSaveReview
}: MobileAIReviewsPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [filterBy, setFilterBy] = useState('all');
  const [filteredReviews, setFilteredReviews] = useState<AIReview[]>([]);
  
  // Edit modal state
  const [editingReview, setEditingReview] = useState<AIReview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter and sort logic
  useEffect(() => {
    let filtered = aiReviews.filter(review => {
      const matchesSearch = review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.brief.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === '5star' && review.rating === 5) ||
                           (filterBy === '4star' && review.rating === 4) ||
                           (filterBy === '3star' && review.rating === 3) ||
                           (filterBy === '2star' && review.rating === 2) ||
                           (filterBy === '1star' && review.rating === 1) ||
                           (filterBy === 'helpful' && review.helpfulCount > 3);
      
      return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'model':
          return a.model.name.localeCompare(b.model.name);
        case 'brief':
          return a.brief.title.localeCompare(b.brief.title);
        case 'helpful':
          return b.helpfulCount - a.helpfulCount;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredReviews(filtered);
  }, [aiReviews, searchTerm, sortBy, filterBy]);

  const handleViewBrief = (briefId: string) => {
    router.push(`/briefs/${briefId}`);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this AI review?')) {
      onDeleteReview(reviewId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedReviews.size} selected AI reviews?`)) {
      onBulkDelete();
    }
  };

  const handleEditReview = (review: AIReview) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  const handleSaveReview = (updatedReview: Partial<AIReview>) => {
    onSaveReview(updatedReview);
    setIsEditModalOpen(false);
    setEditingReview(null);
  };

  // Get unique models and stats
  const uniqueModels = Array.from(new Set(aiReviews.map(review => review.model.name)));
  const avgRating = aiReviews.length > 0 
    ? aiReviews.reduce((sum, r) => sum + r.rating, 0) / aiReviews.length
    : 0;
  const totalHelpful = aiReviews.reduce((sum, r) => sum + r.helpfulCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">AI Reviews</h1>
        <p className="text-purple-100">Manage and moderate AI-generated reviews</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Bot className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{aiReviews.length}</span>
          </div>
          <p className="text-sm text-gray-600">Total AI Reviews</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-600">Average Rating</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{uniqueModels.length}</span>
          </div>
          <p className="text-sm text-gray-600">Unique Models</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{totalHelpful}</span>
          </div>
          <p className="text-sm text-gray-600">Helpful Marks</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search AI reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'created', label: 'By Date' },
              { value: 'rating', label: 'By Rating' },
              { value: 'model', label: 'By Model' },
              { value: 'brief', label: 'By Brief' },
              { value: 'helpful', label: 'By Helpful' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Reviews' },
              { value: '5star', label: '5 Stars' },
              { value: '4star', label: '4 Stars' },
              { value: '3star', label: '3 Stars' },
              { value: '2star', label: '2 Stars' },
              { value: '1star', label: '1 Star' },
              { value: 'helpful', label: 'Helpful (3+)' },
            ]}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={handleBulkDelete}
              variant="danger"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} found
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-900">Select All</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <AIReviewCard
            key={review.id}
            review={review}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
            onViewBrief={handleViewBrief}
            isSelected={selectedReviews.has(review.id)}
            onSelect={onSelectReview}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredReviews.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI reviews found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Edit Modal */}
      <MobileEditAIReviewModal
        review={editingReview}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReview(null);
        }}
        onSave={handleSaveReview}
      />
    </div>
  );
}