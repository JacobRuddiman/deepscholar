'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Cpu, Users, Calendar, Star, TrendingUp, X, Save } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { getAdminModels } from '@/server/actions/admin';
import { useRouter } from 'next/navigation';

interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection state
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit modal state
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch models data
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const result = await getAdminModels({
          page: 1,
          limit: 100,
          search: '',
          filter: 'all',
          sortBy: 'created'
        });

        if (result.success && result.data) {
          setModels(result.data.models);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch models');
        }
      } catch (err) {
        setError('Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };

    void fetchModels();
  }, []);

  // Filter and search logic
  useEffect(() => {
    const filtered = models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.version.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'recent' && new Date(model.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
                           (filterBy === 'openai' && model.provider.toLowerCase().includes('openai')) ||
                           (filterBy === 'anthropic' && model.provider.toLowerCase().includes('anthropic'));
      
      return matchesSearch && matchesFilter;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'provider':
          return a.provider.localeCompare(b.provider);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredModels(filtered);
    setCurrentPage(1);
    
    // Reset selections when filters change
    setSelectedModels(new Set());
    setSelectAll(false);
  }, [models, searchTerm, sortBy, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModels = filteredModels.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(paginatedModels.map(model => model.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectModel = (modelId: string) => {
    const newSelected = new Set(selectedModels);
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId);
    } else {
      newSelected.add(modelId);
    }
    setSelectedModels(newSelected);
    setSelectAll(newSelected.size === paginatedModels.length);
  };

  // Action handlers
  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setIsEditModalOpen(true);
  };

  const handleDeleteModel = (modelId: string) => {
    if (confirm('Are you sure you want to delete this model? This will affect all associated briefs.')) {
      // In a real app, this would make an API call
      setModels(models.filter(model => model.id !== modelId));
      console.log('Delete model:', modelId);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedModels.size} selected models?`)) {
      setModels(models.filter(model => !selectedModels.has(model.id)));
      setSelectedModels(new Set());
      setSelectAll(false);
    }
  };


  const getRatingStars = (rating: number) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Models Management</h1>
          <p className="text-gray-600 mt-2">Manage AI models and their performance</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading models...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Models Management</h1>
          <p className="text-gray-600 mt-2">Manage AI models and their performance</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const hasSelectedModels = selectedModels.size > 0;
  const totalBriefs = 0;
  const totalViews = 0;
  const uniqueProviders = new Set(models.map(model => model.provider)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Models Management</h1>
        <p className="text-gray-600 mt-2">Manage AI models and their performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cpu className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{models.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Providers</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueProviders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Briefs</p>
              <p className="text-2xl font-bold text-gray-900">{totalBriefs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelectedModels && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} selected
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
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'created', label: 'Sort by Created Date' },
              { value: 'name', label: 'Sort by Name' },
              { value: 'provider', label: 'Sort by Provider' },
              { value: 'briefs', label: 'Sort by Brief Count' },
              { value: 'views', label: 'Sort by Views' },
              { value: 'rating', label: 'Sort by Rating' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Models' },
              { value: 'popular', label: 'Popular (10+ briefs)' },
              { value: 'recent', label: 'Recent (Last 30 days)' },
              { value: 'openai', label: 'OpenAI Models' },
              { value: 'anthropic', label: 'Anthropic Models' },
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredModels.length} models found
            </span>
          </div>
        </div>
      </div>

      {/*  Models Table */}
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
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Briefs</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedModels.map((model) => {
              const isSelected = selectedModels.has(model.id);
              return (
                <TableRow key={model.id} className={isSelected ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectModel(model.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Cpu className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{model.name}</p>
                        <p className="text-sm text-gray-500">{model.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                      {model.provider}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{model.version}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">0 briefs</div>
                      <div className="text-gray-500">0 views</div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-gray-400" />
                          <span>0</span>
                        </div>
                      </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>{new Date(model.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">
                        Updated {new Date(model.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditModel(model)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
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
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredModels.length)} of {filteredModels.length} models
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

      {/* Edit Model Modal */}
      {editingModel && (
        <EditModelModal
          model={editingModel}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingModel(null);
          }}
          onSave={(updatedModel) => {
            setModels(models.map(model => 
              model.id === editingModel.id 
                ? { ...model, ...updatedModel }
                : model
            ));
          }}
        />
      )}
    </div>
  );
}

interface EditModelModalProps {
  model: Model;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedModel: Partial<Model>) => void;
}

function EditModelModal({ model, isOpen, onClose, onSave }: EditModelModalProps) {
  const [formData, setFormData] = useState({
    name: model.name,
    provider: model.provider,
    version: model.version
  });

  useEffect(() => {
    setFormData({
      name: model.name,
      provider: model.provider,
      version: model.version
    });
  }, [model]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Model</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Model Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Model name"
          />

          <Input
            label="Provider"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="Provider name"
          />

          <Input
            label="Version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="Version"
          />

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
