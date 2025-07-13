// File: app/admin/ai-reviews/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, X, Save, Star, TrendingUp, Bot, Zap } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { getAdminAIReviews } from '@/server/actions/admin';
import { useRouter } from 'next/navigation';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';
import MobileAIReviewsPage from '@/app/components/admin/MobileAIReviewsPage';

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

export default function AIReviewsPage() {
  const router = useRouter();
  const [aiReviews, setAIReviews] = useState<AIReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<AIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection state
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit modal state
  const [editingReview, setEditingReview] = useState<AIReview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { isMobile } = useDeviceDetection();

  // Fetch AI reviews data
  useEffect(() => {
    const fetchAIReviews = async () => {
      try {
        setLoading(true);
        const result = await getAdminAIReviews({
          page: 1,
          limit: 100,
          search: '',
          filter: 'all',
          sortBy: 'created'
        });

        if (result.success && result.data) {
          setAIReviews(result.data.aiReviews);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to fetch AI reviews');
        }
      } catch (_err) {
        setError('Failed to fetch AI reviews');
      } finally {
        setLoading(false);
      }
    };

    void fetchAIReviews();
  }, []);

  // Filter and search logic
  useEffect(() => {
    const filtered = aiReviews.filter(review => {
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

    // Sort logic
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
    setCurrentPage(1);
    
    // Reset selections when filters change
    setSelectedReviews(new Set());
    setSelectAll(false);
  }, [aiReviews, searchTerm, sortBy, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(paginatedReviews.map(review => review.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
    setSelectAll(newSelected.size === paginatedReviews.length);
  };

  // Action handlers
  const handleViewBrief = (briefId: string) => {
    router.push(`/briefs/${briefId}`);
  };

  const handleEditReview = (review: AIReview) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this AI review?')) {
      // In a real app, this would make an API call
      setAIReviews(aiReviews.filter(review => review.id !== reviewId));
      console.log('Delete AI review:', reviewId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedReviews.size} selected AI reviews?`)) {
      setAIReviews(aiReviews.filter(review => !selectedReviews.has(review.id)));
      setSelectedReviews(new Set());
      setSelectAll(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Reviews Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate AI-generated reviews</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading AI reviews...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Reviews Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate AI-generated reviews</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const hasSelectedReviews = selectedReviews.size > 0;

  // Get unique models
  const uniqueModels = Array.from(new Set(aiReviews.map(review => review.model.name)));
  const modelCounts = uniqueModels.reduce((acc, model) => {
    acc[model] = aiReviews.filter(review => review.model.name === model).length;
    return acc;
  }, {} as Record<string, number>);

  if (isMobile) {
  return (
    <MobileAIReviewsPage
      aiReviews={aiReviews}
      onEditReview={handleEditReview}
      onDeleteReview={(reviewId) => {
        setAIReviews(aiReviews.filter(review => review.id !== reviewId));
      }}
      onBulkDelete={() => {
        setAIReviews(aiReviews.filter(review => !selectedReviews.has(review.id)));
        setSelectedReviews(new Set());
        setSelectAll(false);
      }}
      selectedReviews={selectedReviews}
      onSelectReview={handleSelectReview}
      onSelectAll={handleSelectAll}
      selectAll={selectAll}
      onSaveReview={(updatedReview) => {
        if (editingReview) {
          setAIReviews(aiReviews.map(review => 
            review.id === editingReview.id 
              ? { ...review, ...updatedReview }
              : review
          ));
        }
      }}
    />
  );
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Reviews Management</h1>
        <p className="text-gray-600 mt-2">Manage and moderate AI-generated reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total AI Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{aiReviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg AI Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {aiReviews.length > 0 
                  ? (aiReviews.reduce((sum, r) => sum + r.rating, 0) / aiReviews.length).toFixed(1)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Models</p>
              <p className="text-2xl font-bold text-gray-900">
                {uniqueModels.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Helpful Marks</p>
              <p className="text-2xl font-bold text-gray-900">
                {aiReviews.reduce((sum, r) => sum + r.helpfulCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(modelCounts).map(([model, count]) => (
            <span key={model} className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
              {model}: {count} reviews
            </span>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelectedReviews && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedReviews.size} AI review{selectedReviews.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={handleBulkDelete}
              variant="danger"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search AI reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'created', label: 'Sort by Created Date' },
              { value: 'rating', label: 'Sort by Rating' },
              { value: 'model', label: 'Sort by Model' },
              { value: 'brief', label: 'Sort by Brief' },
              { value: 'helpful', label: 'Sort by Helpful Marks' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All AI Reviews' },
              { value: '5star', label: '5 Star Reviews' },
              { value: '4star', label: '4 Star Reviews' },
              { value: '3star', label: '3 Star Reviews' },
              { value: '2star', label: '2 Star Reviews' },
              { value: '1star', label: '1 Star Reviews' },
              { value: 'helpful', label: 'Helpful (3+ marks)' },
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredReviews.length} AI reviews found
            </span>
          </div>
        </div>
      </div>

      {/* AI Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Brief</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Helpful</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReviews.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-500">
                  No AI reviews found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              paginatedReviews.map((review) => {
                const isSelected = selectedReviews.has(review.id);
                return (
                  <TableRow key={review.id} className={isSelected ? 'bg-purple-50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectReview(review.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-3">
                          {review.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{review.model.name}</span>
                        <span className="text-xs text-gray-500">{review.model.provider}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewBrief(review.brief.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate max-w-xs block"
                      >
                        {review.brief.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      {getRatingStars(review.rating)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.helpfulCount > 5 ? 'bg-green-100 text-green-800' :
                          review.helpfulCount > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {review.helpfulCount} helpful
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBrief(review.brief.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReviews.length)} of {filteredReviews.length} AI reviews
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit AI Review Modal */}
      {editingReview && (
        <EditAIReviewModal
          review={editingReview}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingReview(null);
          }}
          onSave={(updatedReview) => {
            setAIReviews(aiReviews.map(review => 
              review.id === editingReview.id 
                ? { ...review, ...updatedReview }
                : review
            ));
          }}
        />
      )}
    </div>
  );
}

interface EditAIReviewModalProps {
  review: AIReview;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReview: Partial<AIReview>) => void;
}

function EditAIReviewModal({ review, isOpen, onClose, onSave }: EditAIReviewModalProps) {
  const [formData, setFormData] = useState({
    content: review.content,
    rating: review.rating,
    helpfulCount: review.helpfulCount
  });

  useEffect(() => {
    setFormData({
      content: review.content,
      rating: review.rating,
      helpfulCount: review.helpfulCount
    });
  }, [review]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit AI Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={1}>1 Star</option>
              <option value={2}>2 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Helpful Count
            </label>
            <input
              type="number"
              value={formData.helpfulCount}
              onChange={(e) => setFormData({ ...formData, helpfulCount: parseInt(e.target.value) })}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="AI review content..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Review Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Model:</span>
                <span className="ml-2 font-medium">{review.model.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Provider:</span>
                <span className="ml-2 font-medium">{review.model.provider}</span>
              </div>
              <div>
                <span className="text-gray-500">Brief:</span>
                <span className="ml-2 font-medium">{review.brief.title}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
