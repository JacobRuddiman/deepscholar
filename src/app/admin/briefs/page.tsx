'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, MoreHorizontal, FileText, User, Calendar, Star, TrendingUp, X, Save } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { getAdminBriefs } from '@/server/actions/admin';
import { useRouter } from 'next/navigation';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';
import MobileBriefsPage from '@/app/components/admin/MobileBriefsPage';

interface Brief {
  id: string;
  title: string;
  abstract: string | null;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  model: {
    name: string;
    provider: string;
  };
  categories: Array<{
    name: string;
  }>;
  published: boolean;
  viewCount: number;
  reviewCount: number;
  upvoteCount: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function BriefsPage() {
  const router = useRouter();
  const { isMobile } = useDeviceDetection();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [filteredBriefs, setFilteredBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection state
  const [selectedBriefs, setSelectedBriefs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit modal state
  const [editingBrief, setEditingBrief] = useState<Brief | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch briefs data
  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        const result = await getAdminBriefs({
          page: 1,
          limit: 100,
          search: '',
          filter: 'all',
          sortBy: 'created'
        });

        if (result.success && result.data) {
          setBriefs(result.data.briefs);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to fetch briefs');
        }
      } catch (err) {
        setError('Failed to fetch briefs');
      } finally {
        setLoading(false);
      }
    };

    void fetchBriefs();
  }, []);

  // Filter and search logic
  useEffect(() => {
    const filtered = briefs.filter(brief => {
      const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (brief.abstract ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (brief.author.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'published' && brief.published) ||
                           (filterBy === 'draft' && !brief.published) ||
                           (filterBy === 'popular' && brief.viewCount > 50) ||
                           (filterBy === 'recent' && new Date(brief.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.author.name ?? '').localeCompare(b.author.name ?? '');
        case 'views':
          return b.viewCount - a.viewCount;
        case 'rating':
          return (b.averageRating ?? 0) - (a.averageRating ?? 0);
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'upvotes':
          return b.upvoteCount - a.upvoteCount;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredBriefs(filtered);
    setCurrentPage(1);
    
    // Reset selections when filters change
    setSelectedBriefs(new Set());
    setSelectAll(false);
  }, [briefs, searchTerm, sortBy, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredBriefs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBriefs = filteredBriefs.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBriefs(new Set());
    } else {
      setSelectedBriefs(new Set(paginatedBriefs.map(brief => brief.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectBrief = (briefId: string) => {
    const newSelected = new Set(selectedBriefs);
    if (newSelected.has(briefId)) {
      newSelected.delete(briefId);
    } else {
      newSelected.add(briefId);
    }
    setSelectedBriefs(newSelected);
    setSelectAll(newSelected.size === paginatedBriefs.length);
  };

  // Action handlers
  const handleViewBrief = (briefId: string) => {
    router.push(`/briefs/${briefId}`);
  };

  const handleEditBrief = (brief: Brief) => {
    setEditingBrief(brief);
    setIsEditModalOpen(true);
  };

  const handleDeleteBrief = (briefId: string) => {
    if (confirm('Are you sure you want to delete this brief?')) {
      // In a real app, this would make an API call
      setBriefs(briefs.filter(brief => brief.id !== briefId));
      console.log('Delete brief:', briefId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedBriefs.size} selected briefs?`)) {
      setBriefs(briefs.filter(brief => !selectedBriefs.has(brief.id)));
      setSelectedBriefs(new Set());
      setSelectAll(false);
    }
  };

  const handleTogglePublished = (briefId: string) => {
    setBriefs(briefs.map(brief => 
      brief.id === briefId 
        ? { ...brief, published: !brief.published }
        : brief
    ));
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
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
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Briefs Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate research briefs</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading briefs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Briefs Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate research briefs</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const hasSelectedBriefs = selectedBriefs.size > 0;

  // Use mobile version on mobile devices
  if (isMobile) {
    return (
      <MobileBriefsPage
        briefs={briefs}
        onViewBrief={handleViewBrief}
        onEditBrief={handleEditBrief}
        onDeleteBrief={handleDeleteBrief}
        onTogglePublished={handleTogglePublished}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Briefs Management</h1>
        <p className="text-gray-600 mt-2">Manage and moderate research briefs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Briefs</p>
              <p className="text-2xl font-bold text-gray-900">{briefs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.filter(b => b.published).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.reduce((sum, b) => sum + b.viewCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.filter(b => b.averageRating).length > 0 
                  ? (briefs.reduce((sum, b) => sum + (b.averageRating ?? 0), 0) / briefs.filter(b => b.averageRating).length).toFixed(1)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelectedBriefs && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedBriefs.size} brief{selectedBriefs.size !== 1 ? 's' : ''} selected
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
            placeholder="Search briefs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'created', label: 'Sort by Created Date' },
              { value: 'title', label: 'Sort by Title' },
              { value: 'author', label: 'Sort by Author' },
              { value: 'views', label: 'Sort by Views' },
              { value: 'rating', label: 'Sort by Rating' },
              { value: 'reviews', label: 'Sort by Reviews' },
              { value: 'upvotes', label: 'Sort by Upvotes' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Briefs' },
              { value: 'published', label: 'Published Only' },
              { value: 'draft', label: 'Drafts Only' },
              { value: 'popular', label: 'Popular (50+ views)' },
              { value: 'recent', label: 'Recent (Last 7 days)' },
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredBriefs.length} briefs found
            </span>
          </div>
        </div>
      </div>

      {/* Briefs Table */}
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
              <TableHead>Brief</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBriefs.map((brief) => {
              const isSelected = selectedBriefs.has(brief.id);
              return (
                <TableRow key={brief.id} className={isSelected ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectBrief(brief.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{brief.title}</p>
                      {brief.abstract && (
                        <p className="text-sm text-gray-500 truncate mt-1">{brief.abstract}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {brief.categories.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                        {brief.categories.length > 2 && (
                          <span className="text-xs text-gray-500">+{brief.categories.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {brief.author.name ?? 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">{brief.author.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleTogglePublished(brief.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                        brief.published
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {brief.published ? 'Published' : 'Draft'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span>{brief.viewCount} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span>{brief.reviewCount} reviews</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-gray-400" />
                        <span>{brief.upvoteCount} upvotes</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRatingStars(brief.averageRating)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>{new Date(brief.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        {brief.model.name} ({brief.model.provider})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBrief(brief.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBrief(brief)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBrief(brief.id)}
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
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBriefs.length)} of {filteredBriefs.length} briefs
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

      {/* Edit Brief Modal */}
      {editingBrief && (
        <EditBriefModal
          brief={editingBrief}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBrief(null);
          }}
          onSave={(updatedBrief) => {
            setBriefs(briefs.map(brief => 
              brief.id === editingBrief.id 
                ? { ...brief, ...updatedBrief }
                : brief
            ));
          }}
        />
      )}
    </div>
  );
}

interface EditBriefModalProps {
  brief: Brief;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBrief: Partial<Brief>) => void;
}

function EditBriefModal({ brief, isOpen, onClose, onSave }: EditBriefModalProps) {
  const [formData, setFormData] = useState({
    title: brief.title,
    abstract: brief.abstract ?? '',
    published: brief.published
  });

  useEffect(() => {
    setFormData({
      title: brief.title,
      abstract: brief.abstract ?? '',
      published: brief.published
    });
  }, [brief]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Brief</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief title"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abstract
            </label>
            <textarea
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Brief abstract..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Published
            </label>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Brief Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Author:</span>
                <span className="ml-2 font-medium">{brief.author.name ?? 'Anonymous'}</span>
              </div>
              <div>
                <span className="text-gray-500">Model:</span>
                <span className="ml-2 font-medium">{brief.model.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Views:</span>
                <span className="ml-2 font-medium">{brief.viewCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Reviews:</span>
                <span className="ml-2 font-medium">{brief.reviewCount}</span>
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
