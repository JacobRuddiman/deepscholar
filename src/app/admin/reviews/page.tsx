'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, MoreHorizontal, FileText, User, Calendar, Star, TrendingUp, X, Save, MessageSquare, ThumbsUp } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { getAdminReviews } from '@/server/actions/admin';
import { useRouter } from 'next/navigation';

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
    slug: string | null;
  };
  upvotes: Array<{
    id: string;
    userId: string;
  }>;
  helpfulMarks: Array<{
    id: string;
    userId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
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
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const result = await getAdminReviews({
          page: 1,
          limit: 100,
          search: '',
          filter: 'all',
          sortBy: 'created'
        });

        if (result.success && result.data) {
          setReviews(result.data.reviews);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch reviews');
        }
      } catch (err) {
        setError('Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    void fetchReviews();
  }, []);

  // Filter and search logic
  useEffect(() => {
    const filtered = reviews.filter(review => {
      const matchesSearch = review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (review.author.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.brief.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'high-rated' && review.rating >= 4) ||
                           (filterBy === 'low-rated' && review.rating <= 2) ||
                           (filterBy === 'popular' && review.upvotes.length > 5) ||
                           (filterBy === 'helpful' && review.helpfulMarks.length > 3) ||
                           (filterBy === 'recent' && new Date(review.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'author':
          return (a.author.name ?? '').localeCompare(b.author.name ?? '');
        case 'brief':
          return a.brief.title.localeCompare(b.brief.title);
        case 'upvotes':
          return b.upvotes.length - a.upvotes.length;
        case 'helpful':
          return b.helpfulMarks.length - a.helpfulMarks.length;
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
  }, [reviews, searchTerm, sortBy, filterBy]);

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
  const handleViewBrief = (briefId: string, briefSlug: string | null) => {
    if (briefSlug) {
      router.push(`/briefs/${briefSlug}`);
    } else {
      router.push(`/briefs/${briefId}`);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsEditModalOpen(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      // In a real app, this would make an API call
      setReviews(reviews.filter(review => review.id !== reviewId));
      console.log('Delete review:', reviewId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedReviews.size} selected reviews?`)) {
      setReviews(reviews.filter(review => !selectedReviews.has(review.id)));
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
          <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate user reviews</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate user reviews</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const hasSelectedReviews = selectedReviews.size > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
        <p className="text-gray-600 mt-2">Manage and moderate user reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ThumbsUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Upvotes</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.reduce((sum, r) => sum + r.upvotes.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Helpful Marks</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.reduce((sum, r) => sum + r.helpfulMarks.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelectedReviews && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
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
            placeholder="Search reviews..."
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
              { value: 'author', label: 'Sort by Author' },
              { value: 'brief', label: 'Sort by Brief' },
              { value: 'upvotes', label: 'Sort by Upvotes' },
              { value: 'helpful', label: 'Sort by Helpful Marks' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Reviews' },
              { value: 'high-rated', label: 'High Rated (4-5 stars)' },
              { value: 'low-rated', label: 'Low Rated (1-2 stars)' },
              { value: 'popular', label: 'Popular (5+ upvotes)' },
              { value: 'helpful', label: 'Helpful (3+ marks)' },
              { value: 'recent', label: 'Recent (Last 7 days)' },
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredReviews.length} reviews found
            </span>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Brief</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReviews.map((review) => {
              const isSelected = selectedReviews.has(review.id);
              return (
                <TableRow key={review.id} className={isSelected ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectReview(review.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.author.name ?? 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">{review.author.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewBrief(review.brief.id, review.brief.slug)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate max-w-xs block"
                    >
                      {review.brief.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    {getRatingStars(review.rating)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3 text-gray-400" />
                        <span>{review.upvotes.length} upvotes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-gray-400" />
                        <span>{review.helpfulMarks.length} helpful</span>
                      </div>
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
                        onClick={() => handleViewBrief(review.brief.id, review.brief.slug)}
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
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
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

      {/* Edit Review Modal */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingReview(null);
          }}
          onSave={(updatedReview) => {
            setReviews(reviews.map(review => 
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

interface EditReviewModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReview: Partial<Review>) => void;
}

function EditReviewModal({ review, isOpen, onClose, onSave }: EditReviewModalProps) {
  const [formData, setFormData] = useState({
    content: review.content,
    rating: review.rating
  });

  useEffect(() => {
    setFormData({
      content: review.content,
      rating: review.rating
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
          <h3 className="text-lg font-semibold">Edit Review</h3>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Review content..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Review Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Author:</span>
                <span className="ml-2 font-medium">{review.author.name ?? 'Anonymous'}</span>
              </div>
              <div>
                <span className="text-gray-500">Brief:</span>
                <span className="ml-2 font-medium">{review.brief.title}</span>
              </div>
              <div>
                <span className="text-gray-500">Upvotes:</span>
                <span className="ml-2 font-medium">{review.upvotes.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Helpful:</span>
                <span className="ml-2 font-medium">{review.helpfulMarks.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}